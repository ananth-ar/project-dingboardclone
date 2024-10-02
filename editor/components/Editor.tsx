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

const BORDER_WIDTH = 2;
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
    ctx.lineWidth = 2;
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
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
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

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
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
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const { x, y } = getCoordinates(e);
      canvasState.currentLine = { points: [{ x, y }], color };
      setIsDrawing(true);
    },
    [color]
  );

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
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
        borderColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`, // Random color
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
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const { x, y } = getCoordinates(e);
      for (const item of canvasState.items) {
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
      startDrawing(e);
    },
    [startDrawing]
  );

  const drag = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      startDragging(e as unknown as React.MouseEvent<HTMLCanvasElement>);
    };

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      if (isDragging) {
        drag(e as unknown as React.MouseEvent<HTMLCanvasElement>);
      } else if (isDrawing) {
        draw(e as unknown as React.MouseEvent<HTMLCanvasElement>);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      if (isDragging) {
        stopDragging();
      } else if (isDrawing) {
        stopDrawing();
      }
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseout", handleMouseUp);

    updateCanvas(ctx, canvasState, null);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mouseout", handleMouseUp);
    };
  }, [
    startDragging,
    drag,
    draw,
    stopDragging,
    stopDrawing,
    isDragging,
    isDrawing,
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
        <input
          type="color"
          value={color}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setColor(e.target.value)
          }
        />
      </div>
    </div>
  );
};

export default Editor;
