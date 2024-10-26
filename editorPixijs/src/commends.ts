import { Item } from "./item";

// src/commands/Command.ts
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

  execute(command: Command): void {
    command.execute();
    this.undoStack.push(command);
    // Clear redo stack when new command is executed
    this.redoStack = [];
  }

  undo(): void {
    const command = this.undoStack.pop();
    if (command) {
      command.undo();
      this.redoStack.push(command);
    }
  }

  redo(): void {
    const command = this.redoStack.pop();
    if (command) {
      command.execute();
      this.undoStack.push(command);
    }
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}
