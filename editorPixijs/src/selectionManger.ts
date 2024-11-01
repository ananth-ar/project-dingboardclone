// src/selectionManger.ts
import { Application, Container, Graphics } from "pixi.js";
import { Item } from "./item";
import { Toolbar } from "./toolbar";
import { InfiniteCanvas } from "./infinitecanvas";

export class SelectionManager {
  private selectedItem: Item | null = null;
  private selectionRect: Graphics;
  private toolbar: Toolbar;
  private rootContainer: Container;

  constructor(canvas: InfiniteCanvas, app: Application) {
    this.selectionRect = new Graphics();
    this.toolbar = new Toolbar(canvas);
    this.selectionRect.zIndex = 1000;
    // Add to root stage instead of canvas
    this.rootContainer = app.stage;
    app.stage.addChild(this.selectionRect);
  }

  selectItem(item: Item): void {
    this.clearSelection();

    this.selectedItem = item;
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
}
