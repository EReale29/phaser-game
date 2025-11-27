import Phaser from "phaser";

const PLAYER_SPEED = 260;
const ENEMY_BASE_SPEED = 120;
const ENEMY_ACCELERATION = 12;
const SCORE_TICK = 35;

export default class MainScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  private enemies!: Phaser.Physics.Arcade.Group;
  private score = 0;
  private enemySpeed = ENEMY_BASE_SPEED;
  private spawnEvent?: Phaser.Time.TimerEvent;
  private scoreEvent?: Phaser.Time.TimerEvent;
  private difficultyEvent?: Phaser.Time.TimerEvent;

  constructor() {
    super("MainScene");
  }

  create() {
    this.add.rectangle(0, 0, 2000, 2000, 0x0b1221, 0.65).setOrigin(0);
    this.add.rectangle(0, 0, 2000, 2000, 0x16a34a, 0.06).setOrigin(0);

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys({
      w: Phaser.Input.Keyboard.KeyCodes.W,
      a: Phaser.Input.Keyboard.KeyCodes.A,
      s: Phaser.Input.Keyboard.KeyCodes.S,
      d: Phaser.Input.Keyboard.KeyCodes.D,
    }) as Record<string, Phaser.Input.Keyboard.Key>;

    this.player = this.createPlayer();
    this.enemies = this.physics.add.group();

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

    this.physics.add.overlap(
      this.player,
      this.enemies,
      this.handlePlayerHit,
      undefined,
      this
    );

    this.events.emit("score-changed", this.score);
  }

  update() {
    this.handleMovement();
  }

  public getEnemySpeed() {
    return this.enemySpeed;
  }

  private createPlayer() {
    const rect = this.add.rectangle(480, 360, 46, 46, 0x34d399, 1);
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

    const rect = this.add.rectangle(x, y, size, size, 0xef4444, 0.95);
    this.physics.add.existing(rect);

    const body = rect.body as Phaser.Physics.Arcade.Body;
    const direction = new Phaser.Math.Vector2(
      this.player.x - rect.x,
      this.player.y - rect.y
    ).normalize();

    body.setVelocity(direction.x * this.enemySpeed, direction.y * this.enemySpeed);
    body.setAllowGravity(false);
    body.setBounce(1, 1);
    body.setCollideWorldBounds(true);

    this.enemies.add(rect);
  }

  private updateScore(amount: number) {
    this.score += amount;
    this.events.emit("score-changed", this.score);
  }

  private increaseDifficulty() {
    this.enemySpeed += ENEMY_ACCELERATION;
    if (this.spawnEvent) {
      this.spawnEvent.delay = Math.max(450, this.spawnEvent.delay - 60);
    }
  }

  private handlePlayerHit = () => {
    this.finishRun();
  };

  private finishRun() {
    this.spawnEvent?.remove(false);
    this.scoreEvent?.remove(false);
    this.difficultyEvent?.remove(false);
    this.enemies.clear(true, true);

    this.events.emit("game-over", this.score);
    this.scene.launch("GameOverScene", { score: this.score });
    this.scene.stop("UIScene");
    this.scene.stop();
  }
}
