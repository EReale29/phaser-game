import Phaser from "phaser";

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super("GameOverScene");
  }

  create(data: { score: number }) {
    const { score } = data;

    this.cameras.main.fadeIn(200, 0, 0, 0);

    const panel = this.add.rectangle(480, 360, 520, 300, 0x0b1221, 0.92);
    panel.setStrokeStyle(2, 0x22c55e, 0.4);

    this.add
      .text(480, 280, "Game Over", {
        fontSize: "52px",
        color: "#e2e8f0",
        fontFamily: "Inter, sans-serif",
      })
      .setOrigin(0.5);

    this.add
      .text(480, 340, `Score : ${score}`, {
        fontSize: "28px",
        color: "#c7f9cc",
        fontFamily: "Inter, sans-serif",
      })
      .setOrigin(0.5);

    const retryButton = this.add
      .text(480, 420, "↻ Rejouer", {
        fontSize: "24px",
        color: "#0b1221",
        fontStyle: "bold",
        backgroundColor: "#22c55e",
        padding: { x: 16, y: 12 },
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const restart = () => {
      this.scene.stop("GameOverScene");
      this.scene.stop("MainScene");
      this.scene.stop("UIScene");
      this.scene.start("MainScene");
      this.scene.launch("UIScene");
    };

    retryButton.on("pointerdown", restart);

    this.input.keyboard?.addCapture?.(Phaser.Input.Keyboard.KeyCodes.ENTER);
    this.input.keyboard?.addCapture?.(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.input.keyboard?.on?.("keydown-Enter", restart);
    this.input.keyboard?.on?.("keydown-Space", restart);
  }
}
