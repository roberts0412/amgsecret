export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4 py-10">
      <header className="text-center">
        <p className="text-5xl" aria-hidden>🎁</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Amigo Secreto</h1>
        <p className="mt-2 text-slate-600">Sorteio simples, rápido e seguro. Cada um vê só o seu.</p>
      </header>
      <p className="rounded-xl bg-white p-4 text-center text-sm text-slate-500 shadow-sm">
        Em construção — criar e entrar em grupos chegam na próxima etapa.
      </p>
    </main>
  );
}
