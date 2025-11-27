"use client";

import { useEffect, useRef } from "react";
import { initializeGame, destroyGame } from "@/phaser/Game";

export default function GamePage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      initializeGame(containerRef.current.id);
    }

    return () => {
      destroyGame();
    };
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="mb-4 text-center text-sm uppercase tracking-[0.3em] text-emerald-200/80">
        Arcade Dash — Esquive &amp; survie
      </div>
      <div
        id="phaser-container"
        ref={containerRef}
        className="card w-full max-w-4xl overflow-hidden border border-emerald-400/20 bg-black/40"
        style={{ aspectRatio: "4 / 3" }}
      />
      <p className="mt-4 text-center text-slate-200/80">
        Déplacez-vous avec les flèches ou WASD. Les ennemis deviennent plus
        rapides, collectez des points et tenez bon !
      </p>
    </main>
  );
}
