// src/selectionManger.ts
import { Container, Graphics } from "pixi.js";
import { Item } from "./item";
import { Toolbar } from "./toolbar";
import { InfiniteCanvas } from "./infinitecanvas";

export class SelectionManager {
  private selectedItem: Item | null = null;
  private selectionRect: Graphics;
  private toolbar: Toolbar;

  constructor(private canvas: InfiniteCanvas) {
    this.selectionRect = new Graphics();
    this.toolbar = new Toolbar(canvas);
    this.selectionRect.zIndex = 1000; // Ensure selection is always on top
  }

  onCanvasZoomChange(zoom: number): void {
    if (this.selectedItem && this.toolbar.parent) {
      // Update toolbar scale to counter zoom
      this.updateToolbarScale();
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
    // this.clearSelection();

    this.selectedItem = item;
    this.drawSelectionBounds();

    // Add selection rectangle to the item's parent
    // if (item.parent) {
    //   item.parent.addChild(this.selectionRect);
    // }
    item.addChild(this.selectionRect);
    // Position toolbar
    this.toolbar.positionAboveItem(item);

    // Ensure correct initial scale
    this.updateToolbarScale();
  }

  clearSelection(): void {
    if (this.selectionRect.parent) {
      this.selectionRect.parent.removeChild(this.selectionRect);
    }
    if (this.toolbar.parent) {
      this.toolbar.parent.removeChild(this.toolbar);
    }
    this.selectionRect.clear();
    this.selectedItem = null;
  }

  getSelectedItem(): Item | null {
    return this.selectedItem;
  }

  private drawSelectionBounds(): void {
    if (!this.selectedItem) return;

    // Get local bounds of the sprite
    const bounds = this.selectedItem.sprite.getLocalBounds();
    const padding = 2;

    this.selectionRect.clear();
    this.selectionRect
      .rect(
        -padding, // Use local coordinates
        -padding,
        bounds.width + padding * 2,
        bounds.height + padding * 2
      )
      .stroke({
        width: 2 / this.selectedItem.scale.x, // Adjust stroke width for zoom
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
