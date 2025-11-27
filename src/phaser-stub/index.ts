// Minimal Phaser-like stub to run the sample game without the real Phaser dependency.
// This implements only the pieces of the API used by the scenes in src/phaser.

// Utility types
class EventEmitter {
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  on(event: string, cb: (...args: any[]) => void, ctx?: any) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    const bound = ctx ? cb.bind(ctx) : cb;
    this.listeners.get(event)!.add(bound);
    return bound;
  }

  once(event: string, cb: (...args: any[]) => void, ctx?: any) {
    const wrapped = (...args: any[]) => {
      this.off(event, wrapped);
      if (ctx) cb.apply(ctx, args);
      else cb(...args);
    };
    this.on(event, wrapped);
    return wrapped;
  }

  off(event: string, cb: (...args: any[]) => void, _ctx?: any) {
    this.listeners.get(event)?.delete(cb);
  }

  emit(event: string, ...args: any[]) {
    this.listeners.get(event)?.forEach((cb) => cb(...args));
  }
}

class Vector2 {
  constructor(public x: number, public y: number) {}

  normalize() {
    const len = Math.hypot(this.x, this.y) || 1;
    this.x /= len;
    this.y /= len;
    return this;
  }

  scale(amount: number) {
    this.x *= amount;
    this.y *= amount;
    return this;
  }
}

const MathUtil = {
  Between(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  Vector2,
};

// Input handling
namespace Keyboard {
  export class Key {
    isDown = false;
  }

  export enum KeyCodes {
    W = "KeyW" as any,
    A = "KeyA" as any,
    S = "KeyS" as any,
    D = "KeyD" as any,
    UP = "ArrowUp" as any,
    DOWN = "ArrowDown" as any,
    LEFT = "ArrowLeft" as any,
    RIGHT = "ArrowRight" as any,
  }

  export class KeyboardPlugin {
    private keyMap: Record<string, Key> = {};

    constructor() {
      if (typeof window !== "undefined") {
        window.addEventListener("keydown", (e) => {
          const key = this.keyMap[e.code];
          if (key) key.isDown = true;
        });
        window.addEventListener("keyup", (e) => {
          const key = this.keyMap[e.code];
          if (key) key.isDown = false;
        });
      }
    }

    createCursorKeys() {
      return {
        up: this.addKey(KeyCodes.UP),
        down: this.addKey(KeyCodes.DOWN),
        left: this.addKey(KeyCodes.LEFT),
        right: this.addKey(KeyCodes.RIGHT),
      } as any;
    }

    addKeys(keys: Record<string, any>) {
      const mapped: Record<string, Key> = {};
      Object.entries(keys).forEach(([name, code]) => {
        mapped[name] = this.addKey(code as any);
      });
      return mapped;
    }

    addKey(code: KeyCodes) {
      if (!this.keyMap[code as any]) this.keyMap[code as any] = new Key();
      return this.keyMap[code as any];
    }
  }
}

// Game objects
class GameObject {
  interactive = false;
  events = new EventEmitter();
  constructor(public scene: Scene, public x: number, public y: number) {}
  setInteractive(_opts?: any) {
    this.interactive = true;
    return this;
  }
}

class Rectangle extends GameObject {
  originX = 0.5;
  originY = 0.5;
  stroke?: { width: number; color: number; alpha: number };
  body: ArcadeBody | null = null;
  constructor(scene: Scene, x: number, y: number, public width: number, public height: number, public fillColor: number, public alpha = 1) {
    super(scene, x, y);
  }
  setOrigin(x: number, y: number) {
    this.originX = x;
    this.originY = y;
    return this;
  }
  setStrokeStyle(width: number, color: number, alpha: number) {
    this.stroke = { width, color, alpha };
    return this;
  }
}

class Text extends GameObject {
  originX = 0.5;
  originY = 0.5;
  style: any;
  constructor(scene: Scene, x: number, y: number, public text: string, style: any) {
    super(scene, x, y);
    this.style = { ...style };
  }
  setOrigin(x: number, y?: number) {
    this.originX = x;
    this.originY = y ?? x;
    return this;
  }
  setInteractive(opts?: any) {
    super.setInteractive(opts);
    return this;
  }
  on(event: string, cb: (...args: any[]) => void) {
    this.events.on(event, cb);
    return this;
  }
  setStyle(style: any) {
    this.style = { ...this.style, ...style };
    return this;
  }
  setText(value: string) {
    this.text = value;
    return this;
  }
  setShadow(_x: number, _y: number, _color: string, _blur: number) {
    return this;
  }
}

class DisplayList {
  children: GameObject[] = [];

  constructor(private scene: Scene) {}

  rectangle(x: number, y: number, w: number, h: number, color: number, alpha?: number) {
    const rect = new Rectangle(this.scene, x, y, w, h, color, alpha ?? 1);
    this.scene.addToDisplay(rect);
    return rect;
  }

  text(x: number, y: number, text: string, style: any) {
    const obj = new Text(this.scene, x, y, text, style);
    this.scene.addToDisplay(obj);
    return obj;
  }
}

// Physics
class ArcadeBody {
  velocity = new Vector2(0, 0);
  maxVelocity = 1000;
  drag = 1;
  bounce = { x: 0, y: 0 };
  allowGravity = true;
  collideWorldBounds = false;
  constructor(public gameObject: Rectangle, private world: ArcadeWorld) {}

  setVelocity(x: number, y: number) {
    this.velocity.x = Math.max(Math.min(x, this.maxVelocity), -this.maxVelocity);
    this.velocity.y = Math.max(Math.min(y, this.maxVelocity), -this.maxVelocity);
    return this;
  }
  setVelocityX(x: number) {
    return this.setVelocity(x, this.velocity.y);
  }
  setVelocityY(y: number) {
    return this.setVelocity(this.velocity.x, y);
  }
  setMaxVelocity(v: number) {
    this.maxVelocity = v;
    return this;
  }
  setDrag(drag: number) {
    this.drag = drag;
    return this;
  }
  setDamping(_damping: boolean) {
    return this;
  }
  setAllowGravity(value: boolean) {
    this.allowGravity = value;
    return this;
  }
  setBounce(x: number, y: number) {
    this.bounce = { x, y };
    return this;
  }
  setCollideWorldBounds(value: boolean) {
    this.collideWorldBounds = value;
    return this;
  }
}

class ArcadeGroup {
  children: Rectangle[] = [];
  constructor(private world: ArcadeWorld) {}
  add(rect: Rectangle) {
    if (!this.children.includes(rect)) this.children.push(rect);
  }
  clear(remove?: boolean, destroy?: boolean) {
    if (remove) this.children.splice(0);
    if (destroy) this.children.length = 0;
  }
}

class OverlapConfig {
  constructor(public a: Rectangle, public group: ArcadeGroup, public cb: () => void) {}
}

class ArcadeWorld {
  bounds = { left: 0, right: 960, top: 0, bottom: 720, centerX: 480, centerY: 360 };
  gravity = { y: 0 };
  overlaps: OverlapConfig[] = [];
  groups: ArcadeGroup[] = [];
  bodies: Rectangle[] = [];

  constructor(private scene: Scene) {}

  addExisting(obj: Rectangle) {
    obj.body = new ArcadeBody(obj, this);
    this.bodies.push(obj);
    return obj.body;
  }

  addGroup() {
    const g = new ArcadeGroup(this);
    this.groups.push(g);
    return g;
  }

  addOverlap(a: Rectangle, group: ArcadeGroup, cb: () => void) {
    this.overlaps.push(new OverlapConfig(a, group, cb));
  }

  update(delta: number) {
    this.bodies.forEach((rect) => this.stepBody(rect, delta));
    // process overlaps
    this.overlaps.forEach((entry) => {
      entry.group.children.forEach((other) => {
        if (this.checkOverlap(entry.a, other)) {
          entry.cb();
        }
      });
    });
  }

  private stepBody(rect: Rectangle, delta: number) {
    const body = rect.body;
    if (!body) return;
    rect.x += body.velocity.x * (delta / 1000);
    rect.y += body.velocity.y * (delta / 1000);

    if (body.collideWorldBounds) {
      const minX = this.bounds.left + rect.width * rect.originX;
      const maxX = this.bounds.right - rect.width * (1 - rect.originX);
      const minY = this.bounds.top + rect.height * rect.originY;
      const maxY = this.bounds.bottom - rect.height * (1 - rect.originY);
      if (rect.x < minX || rect.x > maxX) body.velocity.x *= -body.bounce.x || -1;
      if (rect.y < minY || rect.y > maxY) body.velocity.y *= -body.bounce.y || -1;
      rect.x = Math.min(Math.max(rect.x, minX), maxX);
      rect.y = Math.min(Math.max(rect.y, minY), maxY);
    }

    body.velocity.x *= body.drag;
    body.velocity.y *= body.drag;
  }

  private checkOverlap(a: Rectangle, b: Rectangle) {
    const ax1 = a.x - a.width * a.originX;
    const ay1 = a.y - a.height * a.originY;
    const ax2 = a.x + a.width * (1 - a.originX);
    const ay2 = a.y + a.height * (1 - a.originY);

    const bx1 = b.x - b.width * b.originX;
    const by1 = b.y - b.height * b.originY;
    const bx2 = b.x + b.width * (1 - b.originX);
    const by2 = b.y + b.height * (1 - b.originY);

    return ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
  }
}

class ArcadePhysics {
  world: ArcadeWorld;
  constructor(private scene: Scene) {
    this.world = new ArcadeWorld(scene);
  }

  add = {
    existing: (obj: Rectangle) => this.world.addExisting(obj),
    group: () => this.world.addGroup(),
    overlap: (a: Rectangle, group: ArcadeGroup, cb: any, _filter?: any, ctx?: any) => {
      this.world.addOverlap(a, group, ctx ? cb.bind(ctx) : cb);
    },
    collider: () => {},
  };
}

// Time
class TimerEvent {
  private timerId?: ReturnType<typeof setInterval>;
  private _delay: number;
  loop: boolean;
  callback: () => void;
  callbackScope?: any;
  constructor(opts: { delay: number; loop?: boolean; callback: () => void; callbackScope?: any }) {
    this._delay = opts.delay;
    this.loop = !!opts.loop;
    this.callback = opts.callback;
    this.callbackScope = opts.callbackScope;
    this.start();
  }
  private start() {
    this.timerId = setInterval(() => {
      if (this.callbackScope) this.callback.call(this.callbackScope);
      else this.callback();
      if (!this.loop) this.remove(false);
    }, this._delay);
  }
  remove(_dispatch?: boolean) {
    if (this.timerId) clearInterval(this.timerId);
  }
  get delay() {
    return this._delay;
  }
  set delay(value: number) {
    this._delay = value;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.start();
    }
  }
}

class TimePlugin {
  addEvent(opts: { delay: number; loop?: boolean; callback: () => void; callbackScope?: any }) {
    return new TimerEvent(opts);
  }
}

// Tweens
class TweenManager {
  add(_config: any) {
    // simplified stub; no animations
    return {};
  }
}

// Cameras
class CameraManager {
  main = {
    setBackgroundColor: (_color: string) => {},
    fadeIn: (_duration: number, _r: number, _g: number, _b: number) => {},
  };
}

// Scene management
class ScenePlugin {
  constructor(private game: Game, private owner: Scene) {}
  start(key: string, data?: any) {
    this.game.activateScene(key, data);
  }
  launch(key: string, data?: any) {
    this.game.activateScene(key, data);
  }
  stop(key?: string) {
    this.game.deactivateScene(key ?? this.owner.sceneKey);
  }
  get(key: string) {
    return this.game.getScene(key);
  }
}

class Scene {
  add!: DisplayList;
  physics!: ArcadePhysics;
  time!: TimePlugin;
  tweens!: TweenManager;
  cameras!: CameraManager;
  input!: { keyboard: Keyboard.KeyboardPlugin | null };
  events: EventEmitter = new EventEmitter();
  scene!: ScenePlugin;
  active = false;

  constructor(public sceneKey: string) {}

  preload?(): void;
  create?(data?: any): void;
  update?(): void;

  /** Internal: wired by Game */
  _init(game: Game, bounds: { width: number; height: number }) {
    this.add = new DisplayList(this);
    this.physics = new ArcadePhysics(this);
    this.time = new TimePlugin();
    this.tweens = new TweenManager();
    this.cameras = new CameraManager();
    this.input = { keyboard: new Keyboard.KeyboardPlugin() };
    this.scene = new ScenePlugin(game, this);
    this.physics.world.bounds.right = bounds.width;
    this.physics.world.bounds.bottom = bounds.height;
    this.physics.world.bounds.centerX = bounds.width / 2;
    this.physics.world.bounds.centerY = bounds.height / 2;
  }

  addToDisplay(obj: GameObject) {
    this.gameObjects.push(obj);
  }

  gameObjects: GameObject[] = [];
}

// Game config
interface GameConfig {
  type: number;
  width: number;
  height: number;
  backgroundColor: string;
  parent: string;
  physics?: any;
  scene: any[];
}

class Game {
  static AUTO = 0;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private scenes: Map<string, Scene> = new Map();
  private activeScenes: Set<string> = new Set();
  private lastTime = 0;
  private rafId?: number;

  constructor(private config: GameConfig) {
    if (typeof document === "undefined") throw new Error("Game can only run in browser");
    const parent = document.getElementById(config.parent);
    if (!parent) throw new Error("Parent container not found");
    this.canvas = document.createElement("canvas");
    this.canvas.width = config.width;
    this.canvas.height = config.height;
    this.canvas.style.background = config.backgroundColor;
    this.ctx = this.canvas.getContext("2d");
    parent.innerHTML = "";
    parent.appendChild(this.canvas);

    let firstKey: string | null = null;
    config.scene.forEach((SceneClass: any, index: number) => {
      const scene = new SceneClass();
      scene._init(this, { width: config.width, height: config.height });
      this.scenes.set(scene.sceneKey, scene);
      if (index === 0) firstKey = scene.sceneKey;
    });

    this.canvas.addEventListener("mousemove", (e) => this.handlePointer(e, "pointerover"));
    this.canvas.addEventListener("mouseout", (e) => this.handlePointer(e, "pointerout"));
    this.canvas.addEventListener("click", (e) => this.handlePointer(e, "pointerdown"));

    // Start first scene
    if (firstKey) this.activateScene(firstKey);
  }

  activateScene(key: string, data?: any) {
    const scene = this.scenes.get(key);
    if (!scene) return;
    if (!scene.active) {
      scene.active = true;
      scene.create?.(data);
    }
    this.activeScenes.add(key);
    if (!this.rafId) {
      this.lastTime = performance.now();
      this.loop(this.lastTime);
    }
  }

  deactivateScene(key: string) {
    const scene = this.scenes.get(key);
    if (scene) {
      scene.active = false;
      scene.gameObjects = [];
    }
    if (this.activeScenes.has(key)) this.activeScenes.delete(key);
  }

  getScene(key: string) {
    return this.scenes.get(key);
  }

  private loop = (time: number) => {
    const delta = time - this.lastTime;
    this.lastTime = time;

    this.activeScenes.forEach((key) => {
      const scene = this.scenes.get(key)!;
      scene.update?.();
      scene.physics.world.update(delta);
    });

    this.render();
    this.rafId = requestAnimationFrame(this.loop);
  };

  private render() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.activeScenes.forEach((key) => {
      const scene = this.scenes.get(key)!;
      scene.gameObjects.forEach((obj) => {
        if (obj instanceof Rectangle) {
          this.drawRect(obj);
        } else if (obj instanceof Text) {
          this.drawText(obj);
        }
      });
    });
  }

  private drawRect(rect: Rectangle) {
    if (!this.ctx) return;
    this.ctx.save();
    this.ctx.globalAlpha = rect.alpha;
    this.ctx.fillStyle = `#${rect.fillColor.toString(16).padStart(6, "0")}`;
    const x = rect.x - rect.width * rect.originX;
    const y = rect.y - rect.height * rect.originY;
    this.ctx.fillRect(x, y, rect.width, rect.height);
    if (rect.stroke) {
      this.ctx.strokeStyle = `#${rect.stroke.color.toString(16).padStart(6, "0")}`;
      this.ctx.globalAlpha = rect.stroke.alpha;
      this.ctx.lineWidth = rect.stroke.width;
      this.ctx.strokeRect(x, y, rect.width, rect.height);
    }
    this.ctx.restore();
  }

  private drawText(text: Text) {
    if (!this.ctx) return;
    this.ctx.save();
    this.ctx.fillStyle = text.style.color ?? "#fff";
    this.ctx.font = `${text.style.fontStyle ?? ""} ${text.style.fontSize ?? "20px"} ${text.style.fontFamily ?? "sans-serif"}`;
    this.ctx.textAlign = "center";
    this.ctx.textBaseline = "middle";
    const x = text.x;
    const y = text.y;
    if (text.style.backgroundColor) {
      const metrics = this.ctx.measureText(text.text);
      const padX = (text.style.padding?.x ?? 0) * 2;
      const padY = (text.style.padding?.y ?? 0) * 2;
      const width = metrics.width + padX;
      const height = parseInt(text.style.fontSize || "20", 10) + padY;
      this.ctx.fillStyle = text.style.backgroundColor;
      this.ctx.fillRect(x - width / 2, y - height / 2, width, height);
      this.ctx.fillStyle = text.style.color ?? "#fff";
    }
    this.ctx.fillText(text.text, x, y);
    this.ctx.restore();
  }

  private handlePointer(evt: MouseEvent, type: "pointerover" | "pointerout" | "pointerdown") {
    const rect = this.canvas.getBoundingClientRect();
    const x = evt.clientX - rect.left;
    const y = evt.clientY - rect.top;
    this.activeScenes.forEach((key) => {
      const scene = this.scenes.get(key)!;
      scene.gameObjects.forEach((obj) => {
        if (!obj.interactive || !(obj instanceof Text)) return;
        const width = obj.text.length * 14;
        const height = parseInt(obj.style.fontSize || "20", 10) + 8;
        const left = obj.x - width / 2;
        const right = obj.x + width / 2;
        const top = obj.y - height / 2;
        const bottom = obj.y + height / 2;
        const inside = x >= left && x <= right && y >= top && y <= bottom;
        if (inside) obj.events.emit(type);
      });
    });
  }

  destroy(_removeCanvas?: boolean) {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.activeScenes.clear();
  }
}

const Phaser = {
  Game,
  Scene,
  Math: MathUtil,
  Input: { Keyboard },
  Physics: { Arcade: ArcadePhysics },
  Time: { TimerEvent },
  GameObjects: { Rectangle, Text },
  Scenes: { Events: { SHUTDOWN: "shutdown" } },
  AUTO: Game.AUTO,
};

export default Phaser;
