"use client";
import React, { useRef, useEffect, useState, useCallback } from "react";

interface Point {
  x: number;
  y: number;
}

interface Line {
  points: Point[];
  color: string;
}

interface DrawingItem {
  id: string;
  lines: Line[];
  position: Point;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  borderColor: string;
}

interface CanvasState {
  items: DrawingItem[];
  currentLine: Line | null;
}

const canvasState: CanvasState = {
  items: [],
  currentLine: null,
};

const BORDER_WIDTH = 1;
const BORDER_PADDING = 5;

const drawLine = (
  ctx: CanvasRenderingContext2D,
  line: Line,
  offsetX: number,
  offsetY: number
) => {
  if (line.points.length > 1) {
    ctx.beginPath();
    ctx.moveTo(line.points[0].x + offsetX, line.points[0].y + offsetY);
    for (let i = 1; i < line.points.length; i++) {
      ctx.lineTo(line.points[i].x + offsetX, line.points[i].y + offsetY);
    }
    ctx.strokeStyle = line.color;
    ctx.lineWidth = 8;
    ctx.stroke();
  }
};

const drawBorder = (ctx: CanvasRenderingContext2D, item: DrawingItem) => {
  const { minX, minY, maxX, maxY } = item.bounds;
  const width = maxX - minX + 2 * BORDER_PADDING;
  const height = maxY - minY + 2 * BORDER_PADDING;

  ctx.beginPath();
  ctx.rect(
    item.position.x + minX - BORDER_PADDING,
    item.position.y + minY - BORDER_PADDING,
    width,
    height
  );
  ctx.strokeStyle = item.borderColor;
  ctx.lineWidth = BORDER_WIDTH;
  ctx.stroke();
};

const updateCanvas = (
  ctx: CanvasRenderingContext2D,
  state: CanvasState,
  draggedItemId: string | null
): void => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  state.items.forEach((item) => {
    item.lines.forEach((line) =>
      drawLine(ctx, line, item.position.x, item.position.y)
    );
    drawBorder(ctx, item);

    // Highlight the border if the item is being dragged
    if (item.id === draggedItemId) {
      ctx.strokeStyle = "red"; // Use a distinct color for the dragged item
      ctx.lineWidth = BORDER_WIDTH * 2; // Make the border thicker
      drawBorder(ctx, item);
    }
  });
  if (state.currentLine) {
    drawLine(ctx, state.currentLine, 0, 0);
  }
};

const calculateBounds = (
  lines: Line[]
): { minX: number; minY: number; maxX: number; maxY: number } => {
  if (lines.length === 0 || lines[0].points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  let minX = lines[0].points[0].x;
  let minY = lines[0].points[0].y;
  let maxX = lines[0].points[0].x;
  let maxY = lines[0].points[0].y;

  lines.forEach((line) => {
    line.points.forEach((point) => {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    });
  });

  return { minX, minY, maxX, maxY };
};

const Editor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [color, setColor] = useState<string>("#000000");
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [drawingMode, setDrawingMode] = useState<boolean>(false);

  const getCoordinates = (e: MouseEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return { x: 0, y: 0 };
    }
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = useCallback(
    (e: MouseEvent) => {
      const { x, y } = getCoordinates(e);
      canvasState.currentLine = { points: [{ x, y }], color };
      setIsDrawing(true);
    },
    [color]
  );

  const draw = useCallback(
    (e: MouseEvent) => {
      if (!isDrawing) return;
      const { x, y } = getCoordinates(e);
      if (canvasState.currentLine) {
        canvasState.currentLine.points.push({ x, y });
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) {
          updateCanvas(ctx, canvasState, draggedItem);
        }
      }
    },
    [isDrawing, draggedItem]
  );

  const stopDrawing = useCallback(() => {
    if (isDrawing && canvasState.currentLine) {
      const bounds = calculateBounds([canvasState.currentLine]);
      const newItem: DrawingItem = {
        id: `drawing-${Date.now()}`,
        lines: [canvasState.currentLine],
        position: { x: 0, y: 0 },
        bounds: bounds,
        borderColor: "#bebebe", //`#${Math.floor(Math.random() * 16777215).toString(16)}` // Random color
      };
      canvasState.items.push(newItem);
      canvasState.currentLine = null;
      setIsDrawing(false);
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        updateCanvas(ctx, canvasState, draggedItem);
      }
    }
  }, [isDrawing, draggedItem]);

  const isPointOnLine = (
    x: number,
    y: number,
    line: Line,
    offsetX: number,
    offsetY: number
  ): boolean => {
    for (let i = 1; i < line.points.length; i++) {
      const x1 = line.points[i - 1].x + offsetX;
      const y1 = line.points[i - 1].y + offsetY;
      const x2 = line.points[i].x + offsetX;
      const y2 = line.points[i].y + offsetY;

      const distance =
        Math.abs((y2 - y1) * x - (x2 - x1) * y + x2 * y1 - y2 * x1) /
        Math.sqrt((y2 - y1) ** 2 + (x2 - x1) ** 2);

      if (distance < 5) {
        // 5 pixels tolerance
        return true;
      }
    }
    return false;
  };

  const startDragging = useCallback(
    (e: MouseEvent) => {
      const { x, y } = getCoordinates(e);
      for (let i = canvasState.items.length - 1; i >= 0; i--) {
        const item = canvasState.items[i];
        if (
          x >= item.position.x + item.bounds.minX - BORDER_PADDING &&
          x <= item.position.x + item.bounds.maxX + BORDER_PADDING &&
          y >= item.position.y + item.bounds.minY - BORDER_PADDING &&
          y <= item.position.y + item.bounds.maxY + BORDER_PADDING
        ) {
          setIsDragging(true);
          setDraggedItem(item.id);
          setDragOffset({
            x: x - item.position.x,
            y: y - item.position.y,
          });
          return;
        }
      }
      // If we didn't hit any existing item, start a new drawing
      if (drawingMode) startDrawing(e);
    },
    [startDrawing]
  );

  const drag = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !draggedItem) return;
      const { x, y } = getCoordinates(e);
      const itemIndex = canvasState.items.findIndex(
        (item) => item.id === draggedItem
      );
      if (itemIndex !== -1) {
        canvasState.items[itemIndex].position = {
          x: x - dragOffset.x,
          y: y - dragOffset.y,
        };
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) {
          updateCanvas(ctx, canvasState, draggedItem);
        }
      }
    },
    [isDragging, draggedItem, dragOffset]
  );

  const stopDragging = useCallback(() => {
    setIsDragging(false);
    setDraggedItem(null);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      updateCanvas(ctx, canvasState, null);
    }
  }, []);

  const handleClick = useCallback((e: MouseEvent) => {
    const { x, y } = getCoordinates(e);
    for (let i = canvasState.items.length - 1; i > -1; i--) {
      const item = canvasState.items[i];
      if (
        x >= item.position.x + item.bounds.minX - BORDER_PADDING &&
        x <= item.position.x + item.bounds.maxX + BORDER_PADDING &&
        y >= item.position.y + item.bounds.minY - BORDER_PADDING &&
        y <= item.position.y + item.bounds.maxY + BORDER_PADDING
      ) {
        setSelectedItem(item.id);
        return;
      }
    }
    setSelectedItem(null);
  }, []);

  const moveItemToBack = useCallback(() => {
    if (selectedItem) {
      const itemIndex = canvasState.items.findIndex(
        (item) => item.id === selectedItem
      );
      if (itemIndex !== -1) {
        const [item] = canvasState.items.splice(itemIndex, 1);
        canvasState.items.unshift(item);
        setSelectedItem(null);
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) {
          updateCanvas(ctx, canvasState, null);
        }
      }
    }
  }, [selectedItem]);

  const toggleDrawingMode = useCallback(() => {
    setDrawingMode((prevMode) => !prevMode);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (!drawingMode) {
        startDragging(e as unknown as MouseEvent);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!drawingMode && isDragging) {
        drag(e as unknown as MouseEvent);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!drawingMode && isDragging) {
        stopDragging();
      }
    };

    const handleCanvasClick = (e: MouseEvent) => {
      if (!drawingMode) {
        handleClick(e as unknown as MouseEvent);
      }
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("click", handleCanvasClick);

    if (drawingMode) {
      canvas.addEventListener("mousedown", startDrawing);
      canvas.addEventListener("mousemove", draw);
      canvas.addEventListener("mouseup", stopDrawing);
      canvas.addEventListener("mouseout", stopDrawing);
    }

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("click", handleCanvasClick);

      canvas.removeEventListener("mousedown", startDrawing);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stopDrawing);
      canvas.removeEventListener("mouseout", stopDrawing);
    };
  }, [
    startDragging,
    drag,
    stopDragging,
    handleClick,
    drawingMode,
    isDragging,
    startDrawing,
    draw,
    stopDrawing,
  ]);

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        style={{ border: "1px solid #000" }}
      />
      <div>
        <button onClick={toggleDrawingMode}>
          {drawingMode ? "Stop Drawing" : "Draw"}
        </button>
        <input
          type="color"
          value={color}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setColor(e.target.value)
          }
        />
        {selectedItem && (
          <button
            className="mx-1 bg-green-600 py-1 px-2 rounded-sm"
            onClick={moveItemToBack}
          >
            Move to Back
          </button>
        )}
      </div>
    </div>
  );
};

export default Editor;
