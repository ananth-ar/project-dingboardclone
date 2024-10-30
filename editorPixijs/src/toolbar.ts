// src/toolbar.ts
import { Container, Graphics, Text } from "pixi.js";
import { Item } from "./item";
import { InfiniteCanvas } from "./infinitecanvas";
import { MoveLayerCommand } from "./commends";

export class Toolbar extends Container {
  private background: Graphics;
  private moveBackBtn: Container;
  private padding = 8;
  private canvas: InfiniteCanvas;

  constructor(canvas: InfiniteCanvas) {
    super();
    this.canvas = canvas;
    this.eventMode = "static";

    // Create toolbar background
    this.background = new Graphics();
    this.addChild(this.background);

    // Create move back button
    this.moveBackBtn = this.createButton("Move Back");
    this.addChild(this.moveBackBtn);

    this.drawBackground();
    this.setupEvents();
  }

  private createButton(label: string): Container {
    const button = new Container();
    button.eventMode = "static";
    button.cursor = "pointer";

    // Button background
    const bg = new Graphics().rect(0, 0, 80, 30).fill({ color: 0x4a4a4a });

    // Button text
    const text = new Text({
      text: label,
      style: {
        fontSize: 12,
        fill: 0xffffff,
      },
    });

    text.position.set(
      (bg.width - text.width) / 2,
      (bg.height - text.height) / 2
    );

    button.addChild(bg, text);
    return button;
  }

  private drawBackground(): void {
    const width = this.moveBackBtn.width + this.padding * 2;
    const height = this.moveBackBtn.height + this.padding * 2;

    this.background
      .clear()
      .rect(0, 0, width, height)
      .fill({ color: 0x2b2b2b, alpha: 0.9 });

    // Position button inside toolbar
    this.moveBackBtn.position.set(this.padding, this.padding);
  }

  private setupEvents(): void {
    this.moveBackBtn.on("pointerdown", (e) => {
      e.stopPropagation(); // Prevent canvas selection
      const selectedItem = this.canvas.getSelectedItem();
      if (selectedItem) {
        // Move item to back

        const moveBackCommand = new MoveLayerCommand(this.canvas, selectedItem);
        this.canvas.setChildIndex(selectedItem, 0);
        this.canvas.gethistory.execute(moveBackCommand);
      }
    });
  }

  // Method to position toolbar above selected item
  positionAboveItem(item: Item): void {
    // Position toolbar relative to item in local space
    this.position.set(
      0,
      -this.height - 10 // 10px gap above item
    );

    // Add toolbar to item
    // item.addChild(this);
  }
}
