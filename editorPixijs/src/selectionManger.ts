// src/selectionManger.ts
import {
  Application,
  Container,
  Graphics,
  RenderTexture,
  Sprite,
} from "pixi.js";
import { Item } from "./item";
import { Toolbar } from "./toolbar";
import { InfiniteCanvas } from "./infinitecanvas";
import { ResizeCommand } from "./commends";

export class SelectionManager {
  private selectedItem: Item | null = null;
  private selectionRect: Graphics;
  private toolbar: Toolbar;
  private rootContainer: Container;
  private app: Application;
  private resizeHandles: Graphics[] = [];
  private handleSize = 10; // Size of resize dots
  private isResizing: boolean = false;
  private activeHandle: number = -1;
  private resizeStartData: {
    width: number;
    height: number;
    x: number;
    y: number;
    globalStart: { x: number; y: number };
    scale: { x: number; y: number };
  } | null = null;

  constructor(canvas: InfiniteCanvas, app: Application) {
    this.selectionRect = new Graphics();
    this.toolbar = new Toolbar(canvas);
    this.selectionRect.zIndex = 1000;

    // Add to root stage instead of canvas
    this.app = app;
    this.rootContainer = app.stage;
    app.stage.addChild(this.selectionRect);
  }

  selectItem(item: Item): void {
    this.clearSelection();
    this.selectedItem = item;
    this.createResizeHandles(); // Create handles
    this.updateSelectionBounds();
    this.updateToolbarPosition();

    if (!this.toolbar.parent) {
      this.rootContainer.addChild(this.toolbar);
    }
  }

  onCanvasChange(): void {
    if (this.selectedItem) {
      // Update toolbar scale to counter zoom
      this.updateSelectionBounds();
      this.updateToolbarPosition();
      // this.updateToolbarScale();
    }
  }

  private updateSelectionBounds(): void {
    if (!this.selectedItem) return;

    const localBounds = this.selectedItem.sprite.getLocalBounds();
    const topLeft = this.selectedItem.toGlobal({ x: 0, y: 0 });
    const bottomRight = this.selectedItem.toGlobal({
      x: localBounds.width,
      y: localBounds.height,
    });

    // Update selection rectangle
    this.selectionRect
      .clear()
      .rect(
        topLeft.x,
        topLeft.y,
        bottomRight.x - topLeft.x,
        bottomRight.y - topLeft.y
      )
      .stroke({
        width: 2,
        color: 0x8a2be2,
        alpha: 1,
      });

    // Update handle positions
    const handlePositions = [
      { x: topLeft.x, y: topLeft.y }, // Top-left
      { x: bottomRight.x, y: topLeft.y }, // Top-right
      { x: bottomRight.x, y: bottomRight.y }, // Bottom-right
      { x: topLeft.x, y: bottomRight.y }, // Bottom-left
    ];

    this.resizeHandles.forEach((handle, index) => {
      handle.position.copyFrom(handlePositions[index]);
      handle.visible = true;
    });
  }

  private updateToolbarPosition(): void {
    if (!this.selectedItem) return;

    const localBounds = this.selectedItem.sprite.getLocalBounds();

    // Get the center point of the item in global space
    const centerTop = this.selectedItem.toGlobal({
      x: localBounds.width / 2, // center x
      y: 0, // top y
    });

    // Position toolbar centered above the item
    this.toolbar.position.set(
      centerTop.x - this.toolbar.width / 2, // center the toolbar
      centerTop.y - this.toolbar.height - 10 // 10px padding above
    );
  }

  private createResizeHandles(): void {
    // Clear existing handles
    this.resizeHandles.forEach((handle) => {
      if (handle.parent) handle.parent.removeChild(handle);
    });
    this.resizeHandles = [];

    // Create 4 handles (dots)
    for (let i = 0; i < 4; i++) {
      const handle = new Graphics()
        .circle(0, 0, this.handleSize / 2)
        .fill({ color: 0x8a2be2 }) // Match selection rectangle color
        .stroke({ width: 2, color: 0xffffff }); // White border for better visibility

      handle.eventMode = "static";
      handle.cursor = this.getHandleCursor(i); // We'll create this method
      handle.zIndex = 1001;
      this.setupResizeHandle(handle, i);
      this.rootContainer.addChild(handle);
      this.resizeHandles.push(handle);
    }
  }

  private getHandleCursor(handleIndex: number): string {
    // Return appropriate cursor based on handle position
    switch (handleIndex) {
      case 0:
        return "nw-resize"; // Top-left
      case 1:
        return "ne-resize"; // Top-right
      case 2:
        return "se-resize"; // Bottom-right
      case 3:
        return "sw-resize"; // Bottom-left
      default:
        return "pointer";
    }
  }

  private setupResizeHandle(handle: Graphics, index: number): void {
    handle
      .on("pointerdown", (e) => this.onResizeStart(e, index))
      .on("globalpointermove", this.onResizeMove)
      .on("pointerup", this.onResizeEnd)
      .on("pointerupoutside", this.onResizeEnd);
  }

  private onResizeStart = (e: any, handleIndex: number): void => {
    if (!this.selectedItem) return;

    e.stopPropagation(); // Prevent other interactions
    this.isResizing = true;
    this.activeHandle = handleIndex;
    const sprite = this.selectedItem.sprite;
    const bounds = sprite.getBounds();

    this.resizeStartData = {
      width: bounds.width,
      height: bounds.height,
      x: this.selectedItem.x,
      y: this.selectedItem.y,
      globalStart: { x: e.global.x, y: e.global.y },
      scale: { x: sprite.scale.x, y: sprite.scale.y },
    };
  };

  private onResizeMove = (e: any): void => {
    if (!this.isResizing || !this.selectedItem || !this.resizeStartData) return;

    const dx = e.global.x - this.resizeStartData.globalStart.x;
    const dy = e.global.y - this.resizeStartData.globalStart.y;

    // Calculate new dimensions based on handle position
    let newWidth = this.resizeStartData.width;
    let newHeight = this.resizeStartData.height;
    let newX = this.resizeStartData.x;
    let newY = this.resizeStartData.y;

    switch (this.activeHandle) {
      case 0: // Top-left
        newWidth = this.resizeStartData.width - dx;
        newHeight = this.resizeStartData.height - dy;
        newX = this.resizeStartData.x + dx;
        newY = this.resizeStartData.y + dy;
        break;
      case 1: // Top-right
        newWidth = this.resizeStartData.width + dx;
        newHeight = this.resizeStartData.height - dy;
        newY = this.resizeStartData.y + dy;
        break;
      case 2: // Bottom-right
        newWidth = this.resizeStartData.width + dx;
        newHeight = this.resizeStartData.height + dy;
        break;
      case 3: // Bottom-left
        newWidth = this.resizeStartData.width - dx;
        newHeight = this.resizeStartData.height + dy;
        newX = this.resizeStartData.x + dx;
        break;
    }

    // Apply minimum size constraint
    const minSize = 20;
    if (newWidth >= minSize && newHeight >= minSize) {
      this.resizeItemFromOriginal(
        this.selectedItem,
        Math.round(newWidth), // Round to prevent fractional pixels
        Math.round(newHeight),
        newX,
        newY
      );
    }
  };

  private resizeItemFromOriginal(
    item: Item,
    targetWidth: number,
    targetHeight: number,
    newX: number,
    newY: number
  ): void {
    // Create a temporary sprite with original texture
    const tempSprite = new Sprite(item.originalTexture);

    // Create a RenderTexture at target size
    const renderTexture = RenderTexture.create({
      width: targetWidth,
      height: targetHeight,
    });

    // Set tempSprite to target dimensions
    tempSprite.width = targetWidth;
    tempSprite.height = targetHeight;

    // Render tempSprite to the new texture
    // Using renderer singleton from app
    this.app.renderer.render(tempSprite, { renderTexture });

    // Update sprite
    item.sprite.texture = renderTexture;
    item.x = newX;
    item.y = newY;

    // Clean up
    tempSprite.destroy();

    // Update bounds and toolbar
    this.updateSelectionBounds();
    this.updateToolbarPosition();
  }

  private onResizeEnd = (): void => {
    // if (this.isResizing && this.selectedItem && this.resizeStartData) {
    //   // Create resize command for undo/redo
    //   const resizeCommand = new ResizeCommand(
    //     this.selectedItem,
    //     {
    //       x: this.resizeStartData.x,
    //       y: this.resizeStartData.y,
    //       scale: this.resizeStartData.scale,
    //     },
    //     {
    //       x: this.selectedItem.x,
    //       y: this.selectedItem.y,
    //       scale: {
    //         x: this.selectedItem.sprite.scale.x,
    //         y: this.selectedItem.sprite.scale.y,
    //       },
    //     }
    //   );

    //   this.selectedItem.history.execute(resizeCommand);
    // }

    this.isResizing = false;
    this.activeHandle = -1;
    this.resizeStartData = null;
  };

  clearSelection(): void {
    this.selectionRect.clear();
    this.resizeHandles.forEach((handle) => {
      handle.visible = false;
    });
    if (this.toolbar.parent) {
      this.toolbar.parent.removeChild(this.toolbar);
    }
    this.selectedItem = null;
  }

  getSelectedItem(): Item | null {
    return this.selectedItem;
  }
}
