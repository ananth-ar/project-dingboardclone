// src/Item.ts
import { Container, Sprite, Texture } from "pixi.js";

export class Item extends Container {
  private sprite: Sprite;
  private isDragging: boolean = false;
  private dragData: any = null;
  private dragStartPos: { x: number; y: number } | null = null;

  constructor(texture: Texture) {
    super();

    if (!texture || !texture.isTexture) {
      throw new Error("Invalid texture provided to Item");
    }

    this.sprite = new Sprite(texture);
    this.addChild(this.sprite);

    // Enable interactivity
    this.eventMode = "static";
    this.cursor = "pointer";

    // Set up drag events
    this.on("pointerdown", this.onDragStart)
      .on("globalpointermove", this.onDragMove)
      .on("pointerup", this.onDragEnd)
      .on("pointerupoutside", this.onDragEnd);
  }

  private onDragStart = (event: any): void => {
    event.stopPropagation();
    this.dragData = event;
    this.isDragging = true;

    // Store the position where the drag started
    this.dragStartPos = {
      x: this.dragData.global.x - this.x,
      y: this.dragData.global.y - this.y,
    };

    // Optional: Bring to front
    if (this.parent) {
      this.parent.addChild(this);
    }
  };

  private onDragMove = (event: any): void => {
    if (this.isDragging && this.dragStartPos) {
      const newPosition = event.global;

      // Update position maintaining the initial grab offset
      this.x = newPosition.x - this.dragStartPos.x;
      this.y = newPosition.y - this.dragStartPos.y;
    }
  };

  private onDragEnd = (): void => {
    this.isDragging = false;
    this.dragData = null;
    this.dragStartPos = null;
  };
}
