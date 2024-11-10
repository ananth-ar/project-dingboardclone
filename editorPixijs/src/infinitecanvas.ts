// src/infinitecanvas.ts
import { Container, Assets, Application, FederatedPointerEvent } from "pixi.js";
import { Item } from "./item";
import { History, ImageUploadCommand } from "./commends";
import { SelectionManager } from "./selectionManger";

export class InfiniteCanvas extends Container {
  private minZoom = 0.1;
  private maxZoom = 5;
  private currentZoom = 1;
  private isPanning: boolean = false;
  private lastPanPosition: { x: number; y: number } | null = null;
  private history: History;
  private selectionManager: SelectionManager;
  private isPanModeEnabled: boolean = false;
  private app: Application; // Add this line

  constructor(app: Application) {
    super();
    this.app = app; // Add this line
    this.selectionManager = new SelectionManager(this, app);
    this.eventMode = "static";
    this.history = new History(this.selectionManager);
    this.setupPan();
    this.setupZoom();
    this.setupKeyboardShortcuts();
    this.createPanButton();
    this.sortableChildren = true; // Enable z-index sorting
    this.hitArea = {
      contains: () => true,
    };
    this.setupCoordinateLogger();

    this.on("click", (event: any) => {
      // Only clear if the click was directly on the canvas
      if (event.target === this) {
        this.selectionManager.clearSelection();
      }
    });
  }

  private setupPan(): void {
    // Setup panning with middle mouse button
    window.addEventListener("pointerdown", (e: PointerEvent) => {
      // Only allow panning in pan mode or with middle button
      if ((this.isPanModeEnabled && e.button === 2) || e.button === 1) {
        e.preventDefault();
        this.selectionManager.clearSelection();
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
      if ((this.isPanModeEnabled && e.button === 2) || e.button === 1) {
        this.stopPanning();
      }
    });

    // Handle case when mouse leaves window during panning
    window.addEventListener("pointerleave", () => {
      this.stopPanning();
    });

    window.addEventListener("contextmenu", (e: Event) => {
      if (this.isPanModeEnabled) {
        e.preventDefault();
      }
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
    window.addEventListener(
      "wheel",
      (e: WheelEvent) => {
        if (e.ctrlKey) {
          e.preventDefault();
          this.selectionManager.clearSelection();

          const delta = -Math.sign(e.deltaY);
          const zoomFactor = 1.1;
          const newZoom =
            this.currentZoom * (delta > 0 ? zoomFactor : 1 / zoomFactor);
          const clampedZoom = Math.min(
            Math.max(newZoom, this.minZoom),
            this.maxZoom
          );

          if (clampedZoom !== this.currentZoom) {
            // Convert screen coordinates to global PixiJS coordinates
            const globalPoint = this.app.renderer.events.pointer;
  
            const beforeZoom = this.toLocal(globalPoint);
            this.scale.set(clampedZoom);
            const afterZoom = this.toGlobal(beforeZoom);

            this.position.x += globalPoint.x - afterZoom.x;
            this.position.y += globalPoint.y - afterZoom.y;

            this.currentZoom = clampedZoom;
            this.selectionManager.onCanvasChange();
          }
        }
      },
      { passive: false }
    );
  }

  async addImageFromFile(file: File): Promise<Item> {
    try {
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
        const dataUrl = await imageLoadPromise;
        // Add timestamp to make URL unique
        const uniqueUrl = `${dataUrl}#${Date.now()}`;

        // Load with unique URL
        const texture = await Assets.load(uniqueUrl);

        const item = new Item(texture, this.history, this.selectionManager);
        this.addChild(item);
        // item.x = window.innerWidth / 2;
        // item.y = window.innerHeight / 2;
        item.x = 100;
        item.y = 100;

        // Add the command to history
        const uploadCommand = new ImageUploadCommand(this, item);
        this.history.execute(uploadCommand);

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
      const item = new Item(texture, this.history, this.selectionManager);
      this.addChild(item);
      return item;
    } catch (error) {
      console.error("Failed to load image:", error);
      throw error;
    }
  }

  public togglePanMode(): void {
    this.isPanModeEnabled = !this.isPanModeEnabled;

    // Update cursor to indicate mode
    document.body.style.cursor = this.isPanModeEnabled ? "grab" : "default";

    // Toggle interactivity of all items
    this.children.forEach((child) => {
      if (child instanceof Item) {
        child.eventMode = this.isPanModeEnabled ? "none" : "static";
      }
    });

    // Clear selection when entering pan mode
    if (this.isPanModeEnabled) {
      this.selectionManager.clearSelection();
    }
  }

  getSelectedItem(): Item | null {
    return this.selectionManager.getSelectedItem();
  }

  get gethistory(): History {
    return this.history;
  }

  private createPanButton(): void {
    const button = document.createElement("button");
    button.textContent = "Pan Mode";
    button.style.position = "fixed";
    button.style.top = "50px"; // Position below your file input
    button.style.left = "10px";

    button.onclick = () => {
      this.togglePanMode();
      button.classList.toggle("active");
      button.textContent = this.isPanModeEnabled ? "Exit Pan Mode" : "Pan Mode";
    };

    document.body.appendChild(button);
  }

  private setupKeyboardShortcuts(): void {
    window.addEventListener("keydown", (e: KeyboardEvent) => {
      // Check for Ctrl + Shift + Z first (order matters!)
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        this.history.redo();
      }
      // Then check for just Ctrl + Z
      else if (e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        this.history.undo();
      }
      // Finally check for Ctrl + Y
      else if (e.ctrlKey && e.key.toLowerCase() === "y") {
        e.preventDefault();
        this.history.redo();
      }
    });
  }

  private setupCoordinateLogger(): void {
    // Using pointerdown event since it works for both mouse and touch
    window.addEventListener("pointerdown", (e: PointerEvent) => {
      // Screen coordinates (browser viewport)
      console.log("Screen Coordinates:", {
        screen_x: e.clientX,
        screen_y: e.clientY,
      });
    });

    // PIXI specific event for global coordinates
    this.on("pointerdown", (e: FederatedPointerEvent) => {
      // Global coordinates (PIXI canvas)
      console.log("PIXI Global Coordinates:", {
        global_x: e.global.x,
        global_y: e.global.y,
        // Also log local coordinates relative to canvas
        local_x: e.getLocalPosition(this).x,
        local_y: e.getLocalPosition(this).y,
      });

      // Log the difference
      // console.log("Coordinate Difference:", {
      //   diff_x: e.global.x - e.clientX,
      //   diff_y: e.global.y - e.clientY,
      // });
    });
  }
}
