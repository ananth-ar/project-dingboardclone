// src/InfiniteCanvas.ts
import { Container, Assets } from "pixi.js";
import { Item } from "./item";

export class InfiniteCanvas extends Container {
  private minZoom = 0.1;
  private maxZoom = 5;
  private currentZoom = 1;
  private isPanning: boolean = false;
  private lastPanPosition: { x: number; y: number } | null = null;

  constructor() {
    super();
    this.eventMode = "static";
    this.setupZoom();
    this.setupPan();
  }
  private setupPan(): void {
    // Setup panning with middle mouse button
    window.addEventListener("pointerdown", (e: PointerEvent) => {
      // Middle mouse button is 1
      if (e.button === 1) {
        e.preventDefault(); // Prevent default browser behavior
        this.startPanning(e);
      }
    });

    window.addEventListener("pointermove", (e: PointerEvent) => {
      if (this.isPanning) {
        e.preventDefault();
        this.updatePanning(e);
      }
    });

    window.addEventListener("pointerup", (e: PointerEvent) => {
      if (e.button === 1) {
        this.stopPanning();
      }
    });

    // Handle case when mouse leaves window during panning
    window.addEventListener("pointerleave", () => {
      this.stopPanning();
    });
  }

  private startPanning(e: PointerEvent): void {
    this.isPanning = true;
    this.lastPanPosition = { x: e.clientX, y: e.clientY };

    // Change cursor to indicate panning
    document.body.style.cursor = "grabbing";
  }

  private updatePanning(e: PointerEvent): void {
    if (!this.isPanning || !this.lastPanPosition) return;

    // Calculate the distance moved
    const deltaX = e.clientX - this.lastPanPosition.x;
    const deltaY = e.clientY - this.lastPanPosition.y;

    // Update canvas position
    this.position.x += deltaX;
    this.position.y += deltaY;

    // Update last position
    this.lastPanPosition = { x: e.clientX, y: e.clientY };
  }

  private stopPanning(): void {
    this.isPanning = false;
    this.lastPanPosition = null;

    // Reset cursor
    document.body.style.cursor = "default";
  }

  private setupZoom(): void {
    // Using wheel event instead of mousewheel (deprecated)
    window.addEventListener(
      "wheel",
      (e: WheelEvent) => {
        // Only handle zoom when Ctrl is pressed
        if (e.ctrlKey) {
          e.preventDefault(); // Prevent browser zoom

          // Calculate zoom direction and factor
          const delta = -Math.sign(e.deltaY);
          const zoomFactor = 1.1; // 10% zoom per step

          // Calculate new zoom level
          const newZoom =
            this.currentZoom * (delta > 0 ? zoomFactor : 1 / zoomFactor);

          // Clamp zoom level between min and max
          const clampedZoom = Math.min(
            Math.max(newZoom, this.minZoom),
            this.maxZoom
          );

          if (clampedZoom !== this.currentZoom) {
            // Get cursor position in screen space
            const cursorX = e.clientX;
            const cursorY = e.clientY;

            // Convert screen coordinates to world coordinates before zoom
            const worldPos = this.toLocal({ x: cursorX, y: cursorY });

            // Calculate zoom change factor
            const zoomChange = clampedZoom / this.currentZoom;

            // Update container scale
            this.scale.set(clampedZoom);

            // Calculate new world position after zoom
            const newScreenPos = this.toGlobal(worldPos);

            // Adjust position to maintain cursor point
            this.position.x += cursorX - newScreenPos.x;
            this.position.y += cursorY - newScreenPos.y;

            this.currentZoom = clampedZoom;
          }
        }
      },
      { passive: false }
    ); // passive: false allows preventDefault()
  }

  async addImageFromFile(file: File): Promise<Item> {
    try {
      // Create a Promise that resolves with the image data
      const imageLoadPromise = new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            resolve(reader.result);
          } else {
            reject(new Error("Failed to read image file"));
          }
        };
        reader.onerror = () => reject(new Error("Failed to read image file"));
        reader.readAsDataURL(file);
      });

      try {
        // Get the data URL
        const dataUrl = await imageLoadPromise;

        // Create a texture using Assets.load
        const texture = await Assets.load(dataUrl);

        // Create and add the item
        const item = new Item(texture);
        this.addChild(item);

        // Position the item at the center of the screen
        item.x = window.innerWidth / 2;
        item.y = window.innerHeight / 2;

        return item;
      } catch (error) {
        console.error("Error creating texture:", error);
        throw error;
      }
    } catch (error) {
      console.error("Failed to load image file:", error);
      throw error;
    }
  }

  async addImage(imageUrl: string): Promise<Item> {
    try {
      const texture = await Assets.load(imageUrl);
      const item = new Item(texture);
      this.addChild(item);
      return item;
    } catch (error) {
      console.error("Failed to load image:", error);
      throw error;
    }
  }
}
