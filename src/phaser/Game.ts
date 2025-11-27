import Phaser from "phaser";
import GameOverScene from "./scenes/GameOverScene";
import MainScene from "./scenes/MainScene";
import MenuScene from "./scenes/MenuScene";
import UIScene from "./scenes/UIScene";

let game: Phaser.Game | null = null;

export function initializeGame(parent: string) {
  if (game) return game;

  game = new Phaser.Game({
    type: Phaser.AUTO,
    width: 960,
    height: 720,
    backgroundColor: "#0c1326",
    parent,
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 0 },
        debug: false,
      },
    },
    scene: [MenuScene, MainScene, UIScene, GameOverScene],
  });

  return game;
}

export function destroyGame() {
  if (game) {
    game.destroy(true);
    game = null;
  }
}
