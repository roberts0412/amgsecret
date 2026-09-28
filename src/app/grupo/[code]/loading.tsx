/** Esqueleto exibido enquanto a página do grupo carrega (conexões lentas de celular). */
export default function Loading() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-4 py-16" aria-busy="true" aria-label="Carregando">
      {[140, 180, 120].map((h, i) => (
        <div key={i} className="animate-pulse rounded-2xl bg-white/80 ring-1 ring-slate-900/5" style={{ height: h }} />
      ))}
      <span className="sr-only">Carregando…</span>
    </div>
  );
}
