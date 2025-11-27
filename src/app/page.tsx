import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <section className="card max-w-2xl text-center">
        <p className="mb-2 text-sm uppercase tracking-[0.25em] text-emerald-300/80">
          Arcade Dash
        </p>
        <h1 className="text-4xl font-bold leading-tight text-white">
          Phaser + Next.js : un mini-jeu d&apos;arcade complet
        </h1>
        <p className="mt-4 text-lg text-slate-200/90">
          Déplacez votre carré, esquivez les drones rouges, gagnez des points et
          survivez le plus longtemps possible. Menu, HUD, difficulté
          progressive, Game Over et Retry sont déjà prêts.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link className="button" href="/game">
            Lancer le jeu
          </Link>
          <a
            className="button"
            style={{ background: "rgba(255,255,255,0.08)", color: "#e2e8f0" }}
            href="https://phaser.io/"
            target="_blank"
            rel="noreferrer"
          >
            Découvrir Phaser
          </a>
        </div>
      </section>
    </main>
  );
}
