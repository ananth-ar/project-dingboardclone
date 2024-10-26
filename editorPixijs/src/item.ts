// src/Item.ts
import { Container, Sprite, Texture } from "pixi.js";
import { MoveCommand, History } from "./commends";


export class Item extends Container {
  private sprite: Sprite;
  private isDragging: boolean = false;
  private dragData: any = null;
  private dragStartPos: { x: number; y: number } | null = null;
  private dragStartPosition: { x: number; y: number } | null = null;

  constructor(texture: Texture, private history: History) {
    super();

    if (!texture || !texture.isTexture) {
      throw new Error("Invalid texture provided to Item");
    }

    this.sprite = new Sprite(texture);
    this.addChild(this.sprite);

    this.eventMode = "static";
    this.cursor = "pointer";

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

    // Store the initial position of the item
    this.dragStartPosition = {
      x: this.x,
      y: this.y,
    };

    if (this.parent) {
      this.parent.addChild(this);
    }
  };

  private onDragMove = (event: any): void => {
    if (this.isDragging && this.dragStartPos) {
      const newPosition = event.global;
      this.x = newPosition.x - this.dragStartPos.x;
      this.y = newPosition.y - this.dragStartPos.y;
    }
  };

  private onDragEnd = (): void => {
    if (this.isDragging && this.dragStartPosition) {
      // Only create a command if the position actually changed
      if (
        this.dragStartPosition.x !== this.x ||
        this.dragStartPosition.y !== this.y
      ) {
        const moveCommand = new MoveCommand(this, this.dragStartPosition, {
          x: this.x,
          y: this.y,
        });
        this.history.execute(moveCommand);
      }
    }

    this.isDragging = false;
    this.dragData = null;
    this.dragStartPos = null;
    this.dragStartPosition = null;
  };
}

