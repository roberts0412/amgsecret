// Sobe um processo do site por núcleo de CPU (o Node usa 1 núcleo por
// processo). Todos atendem na mesma porta; processo que cair é recriado.
//
// APP_WORKERS: nº de processos (padrão: nº de núcleos, até 8).
// DATABASE_POOL_MAX: conexões por processo. Se não definido, divide ~80
// conexões entre os processos (o PostgreSQL aceita 100 por padrão).
import cluster from "node:cluster";
import os from "node:os";

const workers = Math.max(1, Number(process.env.APP_WORKERS) || Math.min(os.availableParallelism(), 8));

if (cluster.isPrimary && workers > 1) {
  if (!process.env.DATABASE_POOL_MAX) {
    process.env.DATABASE_POOL_MAX = String(Math.max(5, Math.floor(80 / workers)));
  }
  console.log(`[cluster] ${workers} processos, ${process.env.DATABASE_POOL_MAX} conexões de banco cada`);

  let stopping = false;
  const recentExits = [];
  for (let i = 0; i < workers; i++) cluster.fork();

  cluster.on("exit", (worker, code, signal) => {
    if (stopping) return;
    console.error(`[cluster] processo ${worker.process.pid} saiu (${signal ?? code}); recriando`);
    // proteção: se os processos morrem sem parar (ex.: erro de configuração), desiste
    const now = Date.now();
    recentExits.push(now);
    while (recentExits.length && now - recentExits[0] > 30_000) recentExits.shift();
    if (recentExits.length > workers * 3) {
      console.error("[cluster] muitas falhas seguidas; encerrando");
      process.exit(1);
    }
    cluster.fork();
  });

  for (const sig of ["SIGTERM", "SIGINT"]) {
    process.on(sig, () => {
      stopping = true;
      for (const w of Object.values(cluster.workers ?? {})) w?.process.kill(sig);
      setTimeout(() => process.exit(0), 10_000).unref();
      cluster.on("exit", () => {
        if (Object.keys(cluster.workers ?? {}).length === 0) process.exit(0);
      });
    });
  }
} else {
  await import("./server.js");
}
