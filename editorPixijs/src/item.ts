// src/Item.ts
import { Container, Sprite, Texture, FederatedPointerEvent } from "pixi.js";

export class Item extends Container {
  private sprite: Sprite;
  private isDragging: boolean = false;
  private dragStartPosition = { x: 0, y: 0 };
  private startPosition = { x: 0, y: 0 };

  constructor(texture: Texture) {
    super();

    this.sprite = new Sprite(texture);
    this.addChild(this.sprite);

    this.eventMode = "static";
    this.cursor = "pointer";

    this.setupDragListeners();
  }

  private setupDragListeners(): void {
    this.on("pointerdown", this.onDragStart)
      .on("pointerup", this.onDragEnd)
      .on("pointerupoutside", this.onDragEnd)
      .on("pointermove", this.onDragMove);
  }

  private onDragStart(event: FederatedPointerEvent): void {
    this.isDragging = true;
    // In PixiJS v8, we can directly use event.global or event.getLocalPosition()
    const localPosition = event.getLocalPosition(this.parent);
    this.dragStartPosition = { x: localPosition.x, y: localPosition.y };
    this.startPosition = { x: this.x, y: this.y };
  }

  private onDragMove(event: FederatedPointerEvent): void {
    if (this.isDragging) {
      const newPosition = event.getLocalPosition(this.parent);
      this.x =
        this.startPosition.x + (newPosition.x - this.dragStartPosition.x);
      this.y =
        this.startPosition.y + (newPosition.y - this.dragStartPosition.y);
    }
  }

  private onDragEnd(): void {
    this.isDragging = false;
  }
}
