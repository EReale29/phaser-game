import Phaser from "phaser";

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super("MenuScene");
  }

  create() {
    this.cameras.main.setBackgroundColor("#0c1326");

    this.add.rectangle(0, 0, 2000, 2000, 0x0b1221, 0.8).setOrigin(0);
    this.add.rectangle(0, 0, 2000, 2000, 0x22c55e, 0.05).setOrigin(0);

    const title = this.add
      .text(480, 250, "Arcade Dash", {
        fontSize: "64px",
        color: "#22c55e",
        fontFamily: "Inter, sans-serif",
        fontStyle: "bold",
      })
      .setOrigin(0.5);

    this.add
      .text(480, 320, "Esquivez les drones rouges et survivez !", {
        fontSize: "22px",
        color: "#e2e8f0",
        fontFamily: "Inter, sans-serif",
      })
      .setOrigin(0.5);

    const playButton = this.add
      .text(480, 410, "▶ Commencer", {
        fontSize: "26px",
        color: "#0b1221",
        fontFamily: "Inter, sans-serif",
        fontStyle: "bold",
        backgroundColor: "#22c55e",
        padding: { x: 18, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const controls = this.add
      .text(480, 480, "Contrôles : WASD ou flèches | Évitez le contact", {
        fontSize: "16px",
        color: "#e5e7eb",
        fontFamily: "Inter, sans-serif",
      })
      .setOrigin(0.5);

    playButton.on("pointerover", () => {
      playButton.setStyle({ backgroundColor: "#34d399" });
    });

    playButton.on("pointerout", () => {
      playButton.setStyle({ backgroundColor: "#22c55e" });
    });

    playButton.on("pointerdown", () => {
      this.scene.start("MainScene");
      this.scene.launch("UIScene");
    });

    this.tweens.add({
      targets: [title, controls, playButton],
      alpha: { from: 0.5, to: 1 },
      yoyo: false,
      duration: 650,
      ease: "Sine.easeOut",
    });
  }
}
