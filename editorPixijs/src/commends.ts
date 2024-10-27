// src/command.ts
import { InfiniteCanvas } from "./infinitecanvas";
import { Item } from "./item";
import { SelectionManager } from "./selectionManger";


export interface Command {
  execute(): void;
  undo(): void;
}

export class MoveCommand implements Command {
  private oldX: number;
  private oldY: number;
  private newX: number;
  private newY: number;

  constructor(
    private item: Item,
    initialPosition: { x: number; y: number },
    finalPosition: { x: number; y: number }
  ) {
    this.oldX = initialPosition.x;
    this.oldY = initialPosition.y;
    this.newX = finalPosition.x;
    this.newY = finalPosition.y;
  }

  execute(): void {
    this.item.position.set(this.newX, this.newY);
  }

  undo(): void {
    this.item.position.set(this.oldX, this.oldY);
  }
}

export class History {
  private undoStack: Command[] = [];
  private redoStack: Command[] = [];

  constructor(private selectionManager: SelectionManager) {}

  execute(command: Command): void {
    // command.execute();
    this.undoStack.push(command);
    // Clear redo stack when new command is executed
    this.redoStack = [];
  }

  undo(): void {
    const command = this.undoStack.pop();
    if (command) {
      this.selectionManager.clearSelection();
      command.undo();
      this.redoStack.push(command);
    }
  }

  redo(): void {
    const command = this.redoStack.pop();
    if (command) {
      this.selectionManager.clearSelection();
      command.execute();
      this.undoStack.push(command);
    }
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.selectionManager.clearSelection();
  }
}

export class ImageUploadCommand implements Command {
  private item: Item | null = null;

  constructor(private canvas: InfiniteCanvas, private addedItem: Item) {
    this.item = addedItem;
  }

  execute(): void {
    if (this.item && !this.item.parent) {
      this.canvas.addChild(this.item);
    }
  }

  undo(): void {
    if (this.item && this.item.parent) {
      this.item.parent.removeChild(this.item);
    }
  }
}

// In src/commands.ts
export class MoveLayerCommand implements Command {
  private oldIndex: number;
  private newIndex: number;

  constructor(
    private canvas: InfiniteCanvas,
    private item: Item
  ) {
    // Store the current index before moving
    this.oldIndex = canvas.getChildIndex(item);
    this.newIndex = 0; // Move back means moving to index 0
  }

  execute(): void {
    this.canvas.setChildIndex(this.item, this.newIndex);
  }

  undo(): void {
    this.canvas.setChildIndex(this.item, this.oldIndex);
  }
}