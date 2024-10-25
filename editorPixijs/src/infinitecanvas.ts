// src/InfiniteCanvas.ts
import { Container, Texture } from "pixi.js";
import { Item } from "./item";


export class InfiniteCanvas extends Container {
  constructor() {
    super();

    // Enable interaction on the canvas
    this.eventMode = "static";
  }

  async addImage(imageUrl: string): Promise<Item> {
    try {
      const texture = await Texture.fromURL(imageUrl);
      const item = new Item(texture);
      this.addChild(item);
      return item;
    } catch (error) {
      console.error("Failed to load image:", error);
      throw error;
    }
  }
}
