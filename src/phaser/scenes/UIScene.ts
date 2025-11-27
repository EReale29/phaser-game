import Phaser from "phaser";
import MainScene from "./MainScene";

export default class UIScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private speedText!: Phaser.GameObjects.Text;
  private multiplierText!: Phaser.GameObjects.Text;
  private shieldText!: Phaser.GameObjects.Text;
  private mainScene?: MainScene;

  constructor() {
    super("UIScene");
  }

  create() {
    this.scoreText = this.add.text(16, 14, "Score : 0", {
      fontSize: "22px",
      color: "#e2e8f0",
      fontFamily: "Inter, sans-serif",
    });

    this.speedText = this.add.text(16, 44, "Vitesse ennemis : 0", {
      fontSize: "16px",
      color: "#a5f3fc",
      fontFamily: "Inter, sans-serif",
    });

    this.multiplierText = this.add.text(16, 70, "Multiplicateur : x1", {
      fontSize: "16px",
      color: "#bef264",
      fontFamily: "Inter, sans-serif",
    });

    this.shieldText = this.add.text(16, 94, "Bouclier : inactif", {
      fontSize: "16px",
      color: "#22d3ee",
      fontFamily: "Inter, sans-serif",
    });

    this.scoreText.setShadow(0, 0, "#000", 10, true, true);
    this.speedText.setShadow(0, 0, "#000", 10, true, true);
    this.multiplierText.setShadow(0, 0, "#000", 10, true, true);
    this.shieldText.setShadow(0, 0, "#000", 10, true, true);

    this.mainScene = this.scene.get("MainScene") as MainScene;
    this.mainScene.events.on("score-changed", this.updateScore, this);
    this.mainScene.events.on("game-over", this.showFinalScore, this);
    this.mainScene.events.on("multiplier-changed", this.updateMultiplier, this);
    this.mainScene.events.on("shield-state", this.updateShield, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
  }

  shutdown() {
    if (this.mainScene) {
      this.mainScene.events.off("score-changed", this.updateScore, this);
      this.mainScene.events.off("game-over", this.showFinalScore, this);
      this.mainScene.events.off("multiplier-changed", this.updateMultiplier, this);
      this.mainScene.events.off("shield-state", this.updateShield, this);
    }
  }

  private updateScore = (score: number) => {
    this.scoreText.setText(`Score : ${score}`);
    if (this.mainScene) {
      const speed = Math.round(this.mainScene.getEnemySpeed());
      this.speedText.setText(`Vitesse ennemis : ${speed}`);
    }
  };

  private showFinalScore = (score: number) => {
    this.scoreText.setText(`Score final : ${score}`);
  };

  private updateMultiplier = (multiplier: number) => {
    this.multiplierText.setText(`Multiplicateur : x${multiplier}`);
  };

  private updateShield = (state: { active: boolean; time: number }) => {
    if (state.active) {
      this.shieldText.setText(`Bouclier : ${state.time}s`);
    } else {
      this.shieldText.setText("Bouclier : inactif");
    }
  };
}
