import Phaser from "phaser";

const PLAYER_SPEED = 260;
const ENEMY_BASE_SPEED = 120;
const ENEMY_ACCELERATION = 12;
const SCORE_TICK = 35;
const POWERUP_INTERVAL = 9000;
const POWERUP_DURATION = 8000;
const MULTIPLIER_STEP_TIME = 10000;

export default class MainScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private aura!: Phaser.GameObjects.Arc;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private enemies!: Phaser.Physics.Arcade.Group;
  private powerUps!: Phaser.Physics.Arcade.Group;
  private score = 0;
  private multiplier = 1;
  private enemySpeed = ENEMY_BASE_SPEED;
  private spawnEvent?: Phaser.Time.TimerEvent;
  private scoreEvent?: Phaser.Time.TimerEvent;
  private difficultyEvent?: Phaser.Time.TimerEvent;
  private powerUpEvent?: Phaser.Time.TimerEvent;
  private multiplierEvent?: Phaser.Time.TimerEvent;
  private shieldActive = false;
  private shieldTimer?: Phaser.Time.TimerEvent;
  private lastShieldSeconds = 0;

  constructor() {
    super("MainScene");
  }

  create() {
    this.resetState();

    const { right: width, bottom: height, centerX, centerY } =
      this.physics.world.bounds;

    this.add
      .rectangle(0, 0, width, height, 0x0b1221, 0.7)
      .setOrigin(0);
    this.add
      .rectangle(0, 0, width, height, 0x16a34a, 0.08)
      .setOrigin(0);

    const grid = this.add.grid(
      centerX,
      centerY,
      width,
      height,
      80,
      80,
      undefined,
      undefined,
      0x10b981,
      0.12
    );
    this.tweens.add({
      targets: grid,
      angle: 360,
      duration: 24000,
      ease: "Linear",
      repeat: -1,
    });

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
    }) as Record<string, Phaser.Input.Keyboard.Key>;

    this.player = this.createPlayer(centerX, centerY);
    this.enemies = this.physics.add.group();
    this.powerUps = this.physics.add.group();

    this.spawnEvent = this.time.addEvent({
      delay: 1200,
      loop: true,
      callback: this.spawnEnemy,
      callbackScope: this,
    });

    this.scoreEvent = this.time.addEvent({
      delay: 500,
      loop: true,
      callback: () => this.updateScore(SCORE_TICK),
    });

    this.difficultyEvent = this.time.addEvent({
      delay: 7000,
      loop: true,
      callback: this.increaseDifficulty,
      callbackScope: this,
    });

    this.powerUpEvent = this.time.addEvent({
      delay: POWERUP_INTERVAL,
      loop: true,
      startAt: 2000,
      callback: this.spawnPowerUp,
      callbackScope: this,
    });

    this.multiplierEvent = this.time.addEvent({
      delay: MULTIPLIER_STEP_TIME,
      loop: true,
      callback: this.boostMultiplier,
      callbackScope: this,
    });

    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.handlePlayerHit,
      undefined,
      this
    );

    this.physics.add.overlap(
      this.player,
      this.powerUps,
      this.handlePowerUp,
      undefined,
      this
    );

    this.events.emit("score-changed", this.score);
    this.events.emit("multiplier-changed", this.multiplier);
    this.events.emit("shield-state", { active: this.shieldActive, time: 0 });
  }

  private resetState() {
    this.score = 0;
    this.multiplier = 1;
    this.enemySpeed = ENEMY_BASE_SPEED;
    this.spawnEvent?.remove(false);
    this.scoreEvent?.remove(false);
    this.difficultyEvent?.remove(false);
    this.powerUpEvent?.remove(false);
    this.multiplierEvent?.remove(false);
    this.shieldTimer?.remove(false);
    this.enemies?.clear(true, true);
    this.powerUps?.clear(true, true);
    this.shieldActive = false;
    this.lastShieldSeconds = 0;
  }

  update() {
    this.handleMovement();
    if (this.aura) {
      this.aura.setPosition(this.player.x, this.player.y);
    }
    this.refreshShieldTimer();
  }

  public getEnemySpeed() {
    return this.enemySpeed;
  }

  public getMultiplier() {
    return this.multiplier;
  }

  private createPlayer(x: number, y: number) {
    this.aura = this.add
      .circle(x, y, 38, 0x22c55e, 0.12)
      .setBlendMode(Phaser.BlendModes.ADD);
    const rect = this.add.rectangle(x, y, 46, 46, 0x34d399, 1);
    rect.setStrokeStyle(3, 0x22c55e, 0.9);
    this.tweens.add({
      targets: this.aura,
      scale: { from: 1, to: 1.15 },
      alpha: { from: 0.2, to: 0.5 },
      yoyo: true,
      duration: 900,
      repeat: -1,
    });

    this.physics.add.existing(rect);
    const body = rect.body as Phaser.Physics.Arcade.Body;
    body.setCollideWorldBounds(true);
    body.setMaxVelocity(PLAYER_SPEED);
    body.setDamping(true);
    body.setDrag(0.85);
    return rect;
  }

  private handleMovement() {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0);

    const left = this.cursors.left?.isDown || this.wasd.a.isDown;
    const right = this.cursors.right?.isDown || this.wasd.d.isDown;
    const up = this.cursors.up?.isDown || this.wasd.w.isDown;
    const down = this.cursors.down?.isDown || this.wasd.s.isDown;

    if (left) body.setVelocityX(-PLAYER_SPEED);
    if (right) body.setVelocityX(PLAYER_SPEED);
    if (up) body.setVelocityY(-PLAYER_SPEED);
    if (down) body.setVelocityY(PLAYER_SPEED);

    body.velocity.normalize().scale(PLAYER_SPEED);
  }

  private spawnEnemy() {
    const bounds = this.physics.world.bounds;
    const size = Phaser.Math.Between(20, 40);
    const edge = Phaser.Math.Between(0, 3);
    let x = bounds.centerX;
    let y = bounds.centerY;

    if (edge === 0) {
      x = bounds.left - size;
      y = Phaser.Math.Between(bounds.top, bounds.bottom);
    } else if (edge === 1) {
      x = bounds.right + size;
      y = Phaser.Math.Between(bounds.top, bounds.bottom);
    } else if (edge === 2) {
      x = Phaser.Math.Between(bounds.left, bounds.right);
      y = bounds.top - size;
    } else {
      x = Phaser.Math.Between(bounds.left, bounds.right);
      y = bounds.bottom + size;
    }

    const isElite = Phaser.Math.FloatBetween(0, 1) > 0.75;
    const color = isElite ? 0xf97316 : 0xef4444;
    const rect = this.add.rectangle(x, y, size, size, color, 0.95);
    this.physics.add.existing(rect);

    const body = rect.body as Phaser.Physics.Arcade.Body;
    const direction = new Phaser.Math.Vector2(
      this.player.x - rect.x,
      this.player.y - rect.y
    ).normalize();

    const speed = isElite ? this.enemySpeed * 1.45 : this.enemySpeed;
    body.setVelocity(direction.x * speed, direction.y * speed);
    body.setAllowGravity(false);
    body.setBounce(1, 1);
    body.setCollideWorldBounds(true);

    this.enemies.add(rect);
  }

  private spawnPowerUp() {
    const bounds = this.physics.world.bounds;
    const size = 22;
    const padding = 50;
    const x = Phaser.Math.Between(bounds.left + padding, bounds.right - padding);
    const y = Phaser.Math.Between(bounds.top + padding, bounds.bottom - padding);

    const orb = this.add.circle(x, y, size, 0x22c55e, 0.6);
    orb.setStrokeStyle(3, 0x86efac, 0.9);
    this.tweens.add({
      targets: orb,
      scale: { from: 0.9, to: 1.1 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    this.physics.add.existing(orb);
    const body = orb.body as Phaser.Physics.Arcade.Body;
    body.setCircle(size);
    body.setAllowGravity(false);
    body.setImmovable(true);
    this.powerUps.add(orb);
  }

  private handlePowerUp = (
    _player: Phaser.GameObjects.GameObject,
    orb: Phaser.GameObjects.GameObject
  ) => {
    orb.destroy();
    this.activateShield();
    this.updateScore(SCORE_TICK * 2);
  };

  private updateScore(amount: number) {
    this.score += amount * this.multiplier;
    this.events.emit("score-changed", this.score);
  }

  private increaseDifficulty() {
    this.enemySpeed += ENEMY_ACCELERATION;
    if (this.spawnEvent) {
      this.spawnEvent.delay = Math.max(450, this.spawnEvent.delay - 60);
    }
  }

  private boostMultiplier() {
    this.multiplier = Math.min(10, this.multiplier + 1);
    this.events.emit("multiplier-changed", this.multiplier);
  }

  private handlePlayerHit = () => {
    if (this.shieldActive) {
      this.deactivateShield();
      return;
    }
    this.finishRun();
  };

  private finishRun() {
    this.spawnEvent?.remove(false);
    this.scoreEvent?.remove(false);
    this.difficultyEvent?.remove(false);
    this.powerUpEvent?.remove(false);
    this.multiplierEvent?.remove(false);
    this.enemies.clear(true, true);
    this.powerUps.clear(true, true);
    this.deactivateShield();

    this.events.emit("game-over", this.score);
    this.scene.launch("GameOverScene", { score: this.score });
    this.scene.stop("UIScene");
    this.scene.stop();
  }

  private activateShield() {
    this.shieldActive = true;
    this.aura.setFillStyle(0x22d3ee, 0.25);
    this.aura.setStrokeStyle(3, 0x22d3ee, 0.8);
    this.shieldTimer?.remove(false);
    this.shieldTimer = this.time.addEvent({
      delay: POWERUP_DURATION,
      callback: this.deactivateShield,
      callbackScope: this,
    });
    this.lastShieldSeconds = Math.ceil(POWERUP_DURATION / 1000);
    this.events.emit("shield-state", {
      active: true,
      time: this.lastShieldSeconds,
    });
  }

  private deactivateShield = () => {
    this.shieldActive = false;
    this.aura.setFillStyle(0x22c55e, 0.12);
    this.aura.setStrokeStyle(3, 0x22c55e, 0.9);
    this.shieldTimer?.remove(false);
    this.lastShieldSeconds = 0;
    this.events.emit("shield-state", { active: false, time: 0 });
  };

  private refreshShieldTimer() {
    if (!this.shieldActive || !this.shieldTimer) return;
    const remaining = Math.ceil(this.shieldTimer.getRemaining() / 1000);
    if (remaining !== this.lastShieldSeconds) {
      this.lastShieldSeconds = remaining;
      this.events.emit("shield-state", { active: true, time: remaining });
    }
  }
}
