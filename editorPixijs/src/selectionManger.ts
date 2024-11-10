// src/selectionManger.ts
import { Application, Container, Graphics } from "pixi.js";
import { Item } from "./item";
import { Toolbar } from "./toolbar";
import { InfiniteCanvas } from "./infinitecanvas";
import { ResizeCommand } from "./commends";

export class SelectionManager {
  private selectedItem: Item | null = null;
  private selectionRect: Graphics;
  private toolbar: Toolbar;
  private rootContainer: Container;
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
    const bounds = this.selectedItem.sprite.getBounds();

    // Update selection rectangle
    this.selectionRect
      .clear()
      .rect(
        bounds.x, // Use bounds directly
        bounds.y, // Use bounds directly
        bounds.width, // Use width from bounds
        bounds.height // Use height from bounds
      )
      .stroke({
        width: 2,
        color: 0x8a2be2,
        alpha: 1,
      });

    // Update handle positions
    const handlePositions = [
      { x: bounds.x, y: bounds.y }, // Top-left
      { x: bounds.x + bounds.width, y: bounds.y }, // Top-right
      { x: bounds.x + bounds.width, y: bounds.y + bounds.height }, // Bottom-right
      { x: bounds.x, y: bounds.y + bounds.height }, // Bottom-left
    ];

    this.resizeHandles.forEach((handle, index) => {
      handle.position.copyFrom(handlePositions[index]);
      handle.visible = true;
    });
  }

  private updateToolbarPosition(): void {
    if (!this.selectedItem) return;

    const bounds = this.selectedItem.sprite.getBounds();

    // Calculate center-top position directly from bounds
    const centerTopX = bounds.x + bounds.width / 2;
    const centerTopY = bounds.y; // Top of bounds

    this.toolbar.position.set(
      centerTopX - this.toolbar.width / 2,
      centerTopY - this.toolbar.height - 10
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

    e.stopPropagation();
    this.isResizing = true;
    this.activeHandle = handleIndex;
    const sprite = this.selectedItem.sprite;

    // Get the position in canvas's local space
    const localPos = this.selectedItem.parent.toLocal(e.global);
    console.log("Local position:", localPos);

    this.resizeStartData = {
      width: sprite.width,
      height: sprite.height,
      x: this.selectedItem.x,
      y: this.selectedItem.y,
      globalStart: localPos, // Store the start position in canvas's local space
      scale: { x: sprite.scale.x, y: sprite.scale.y },
    };
  };

  private onResizeMove = (e: any): void => {
    if (!this.isResizing || !this.selectedItem || !this.resizeStartData) return;

    // Convert current mouse position to canvas's local space
    const localPos = this.selectedItem.parent.toLocal(e.global);

    // Calculate deltas in local space
    const dx = localPos.x - this.resizeStartData.globalStart.x;
    const dy = localPos.y - this.resizeStartData.globalStart.y;

    // Calculate new dimensions based on handle position
    let newWidth = this.resizeStartData.width;
    let newHeight = this.resizeStartData.height;
    let newX = this.resizeStartData.x;
    let newY = this.resizeStartData.y;

    // Aspect ratio of the original image
    const aspectRatio =
      this.resizeStartData.width / this.resizeStartData.height;

    switch (this.activeHandle) {
      case 0: // Top-left
        if (e.shiftKey) {
          // Maintain aspect ratio when shift is held
          const avgDelta = (dx + dy) / 2;
          newWidth = this.resizeStartData.width - avgDelta;
          newHeight = newWidth / aspectRatio;
          newX =
            this.resizeStartData.x + (this.resizeStartData.width - newWidth);
          newY =
            this.resizeStartData.y + (this.resizeStartData.height - newHeight);
        } else {
          newWidth = this.resizeStartData.width - dx;
          newHeight = this.resizeStartData.height - dy;
          newX = this.resizeStartData.x + dx;
          newY = this.resizeStartData.y + dy;
        }
        break;

      case 1: // Top-right
        if (e.shiftKey) {
          const avgDelta = (-dx + dy) / 2;
          newWidth = this.resizeStartData.width + avgDelta;
          newHeight = newWidth / aspectRatio;
          newY =
            this.resizeStartData.y + (this.resizeStartData.height - newHeight);
        } else {
          newWidth = this.resizeStartData.width + dx;
          newHeight = this.resizeStartData.height - dy;
          newY = this.resizeStartData.y + dy;
        }
        break;

      case 2: // Bottom-right
        if (e.shiftKey) {
          const avgDelta = (dx + dy) / 2;
          newWidth = this.resizeStartData.width + avgDelta;
          newHeight = newWidth / aspectRatio;
        } else {
          newWidth = this.resizeStartData.width + dx;
          newHeight = this.resizeStartData.height + dy;
        }
        break;

      case 3: // Bottom-left
        if (e.shiftKey) {
          const avgDelta = (-dx + dy) / 2;
          newWidth = this.resizeStartData.width + avgDelta;
          newHeight = newWidth / aspectRatio;
          newX =
            this.resizeStartData.x + (this.resizeStartData.width - newWidth);
        } else {
          newWidth = this.resizeStartData.width - dx;
          newHeight = this.resizeStartData.height + dy;
          newX = this.resizeStartData.x + dx;
        }
        break;
    }

    // Apply minimum size constraint
    const minSize = 20;
    if (newWidth >= minSize && newHeight >= minSize) {
      // Ensure positions are rounded to prevent blurry rendering
      this.quickResize(
        this.selectedItem,
        Math.round(newWidth),
        Math.round(newHeight),
        Math.round(newX),
        Math.round(newY)
      );
    }
  };

  private onResizeEnd = (): void => {
    if (this.isResizing && this.selectedItem && this.resizeStartData) {
      // Create resize command with actual dimensions
      const resizeCommand = new ResizeCommand(
        this.selectedItem,
        {
          x: this.resizeStartData.x,
          y: this.resizeStartData.y,
          width: this.resizeStartData.width, // Use actual start dimensions
          height: this.resizeStartData.height,
        },
        {
          x: this.selectedItem.x,
          y: this.selectedItem.y,
          width: this.selectedItem.sprite.width, // Use final dimensions
          height: this.selectedItem.sprite.height,
        }
      );
      this.selectedItem.getHistory().execute(resizeCommand);
    }

    this.isResizing = false;
    this.activeHandle = -1;
    this.resizeStartData = null;
  };

  // New method for quick resize during drag
  private quickResize(
    item: Item,
    width: number,
    height: number,
    x: number,
    y: number
  ): void {
    // Directly modify sprite dimensions - very lightweight
    item.sprite.width = width;
    item.sprite.height = height;
    item.x = x;
    item.y = y;

    // Update bounds and toolbar
    this.updateSelectionBounds();
    this.updateToolbarPosition();
  }

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
