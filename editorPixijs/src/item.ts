// src/item.ts
import { Container, Sprite, Texture } from "pixi.js";
import { MoveCommand, History } from "./commends";
import { SelectionManager } from "./selectionManger";

export class Item extends Container {
  public sprite: Sprite;
  private isDragging: boolean = false;
  private dragStartPos: { x: number; y: number } | null = null;
  private dragStartPosition: { x: number; y: number } | null = null;

  constructor(
    texture: Texture,
    private history: History,
    private selectionManager: SelectionManager
  ) {
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
      .on("pointerupoutside", this.onDragEnd)
      .on("click", this.onClick);
  }

  private onClick = (event: any): void => {
    event.stopPropagation();
    this.selectionManager.selectItem(this);
  };

  private onDragStart = (event: any): void => {
    event.stopPropagation();
    this.isDragging = true;

    // Get the local position of the click relative to the parent
    const localPos = this.parent.toLocal(event.global);
    this.dragStartPos = {
      x: localPos.x - this.x,
      y: localPos.y - this.y,
    };

    this.selectionManager.selectItem(this);
    // Store initial position for undo/redo
    this.dragStartPosition = {
      x: this.x,
      y: this.y,
    };

    // Optional: Bring to front
    // if (this.parent) {
    //   this.parent.addChild(this);
    // }
  };

  private onDragMove = (event: any): void => {
    if (this.isDragging && this.dragStartPos) {
      // Convert the global position to parent's local space
      const localPos = this.parent.toLocal(event.global);
      this.selectionManager.updateSelectionBounds();

      // Update position maintaining the initial offset
      this.x = localPos.x - this.dragStartPos.x;
      this.y = localPos.y - this.dragStartPos.y;
    }
  };

  private onDragEnd = (): void => {
    if (this.isDragging && this.dragStartPosition) {
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
    this.dragStartPos = null;
    this.dragStartPosition = null;
  };
}
