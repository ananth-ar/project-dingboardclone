// src/selectionManger.ts
import { Application, Container, Graphics } from "pixi.js";
import { Item } from "./item";
import { Toolbar } from "./toolbar";
import { InfiniteCanvas } from "./infinitecanvas";

export class SelectionManager {
  private selectedItem: Item | null = null;
  private selectionRect: Graphics;
  private toolbar: Toolbar;

  constructor(canvas: InfiniteCanvas, app: Application) {
    this.selectionRect = new Graphics();
    this.toolbar = new Toolbar(canvas);
    this.selectionRect.zIndex = 1000;
    // Add to root stage instead of canvas
    app.stage.addChild(this.selectionRect);
  }

  onCanvasZoomChange(): void {

    if (this.selectedItem) {
      // Update toolbar scale to counter zoom
      this.updateSelectionBounds();
      // this.updateToolbarScale();
    }
  }

  private updateToolbarScale(): void {
    if (this.selectedItem) {
      // Get the global scale taking into account all transformations
      const globalScale = this.getGlobalScale(this.selectedItem);
      this.toolbar.scale.set(1 / globalScale.x, 1 / globalScale.y);
    }
  }

  private getGlobalScale(item: Container): { x: number; y: number } {
    let current = item;
    let scaleX = 1;
    let scaleY = 1;

    while (current) {
      scaleX *= current.scale.x;
      scaleY *= current.scale.y;
      current = current.parent;
    }

    return { x: scaleX, y: scaleY };
  }

  selectItem(item: Item): void {
    // Deselect previous item if any
    this.clearSelection();

    this.selectedItem = item;
    this.drawSelectionBounds();

    // item.addChild(this.selectionRect);
    // Position toolbar
    this.toolbar.positionAboveItem(item);

    // Ensure correct initial scale
    // this.updateToolbarScale();
  }

  clearSelection(): void {
    if (this.selectionRect.parent) {
      // No need to remove since it stays in stage, just clear the graphics
      this.selectionRect.clear();
    }
    if (this.toolbar.parent) {
      this.toolbar.parent.removeChild(this.toolbar);
    }
    this.selectedItem = null;
  }

  getSelectedItem(): Item | null {
    return this.selectedItem;
  }

  private drawSelectionBounds(): void {
    if (!this.selectedItem) return;

    // Get bounds in local space
    const localBounds = this.selectedItem.sprite.getLocalBounds();

    // Convert to global (screen) coordinates through all transformations
    const topLeft = this.selectedItem.toGlobal({ x: 0, y: 0 });
    const bottomRight = this.selectedItem.toGlobal({
      x: localBounds.width,
      y: localBounds.height,
    });

    // Draw in screen coordinates - no need to adjust for zoom since we're in screen space
    this.selectionRect
      .clear()
      .rect(
        topLeft.x,
        topLeft.y,
        bottomRight.x - topLeft.x,
        bottomRight.y - topLeft.y
      )
      .stroke({
        width: 3, // Constant pixel width
        color: 0x8a2be2,
        alpha: 1,
      });
  }

  updateSelectionBounds(): void {
    if (this.selectedItem) {
      this.drawSelectionBounds();

      // No need to update toolbar position as it's now relative to the item
      // and will move with it automatically
    }
  }
}
