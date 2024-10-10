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
  draggedItemId: string | null,
  pan: Point,
  scale: number
): void => {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();

  ctx.save();
  ctx.scale(scale, scale);
  ctx.translate(pan.x / scale, pan.y / scale);

  state.items.forEach((item) => {
    item.lines.forEach((line) =>
      drawLine(ctx, line, item.position.x, item.position.y)
    );
    drawBorder(ctx, item);

    if (item.id === draggedItemId) {
      ctx.strokeStyle = "red";
      ctx.lineWidth = (BORDER_WIDTH * 2) / scale;
      drawBorder(ctx, item);
    }
  });
  if (state.currentLine) {
    drawLine(ctx, state.currentLine, 0, 0);
  }

  ctx.restore();
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

const Editor = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [color, setColor] = useState<string>("#000000");
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [selectedItemPosition, setSelectedItemPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [drawingMode, setDrawingMode] = useState<boolean>(false);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [scale, setScale] = useState<number>(1);

  const getCoordinates = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return { x: 0, y: 0 };
      }
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left - pan.x) / scale,
        y: (e.clientY - rect.top - pan.y) / scale,
      };
    },
    [pan, scale]
  );

  const startDrawing = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const { x, y } = getCoordinates(e);
      canvasState.currentLine = { points: [{ x, y }], color };
      setIsDrawing(true);
    },
    [color, getCoordinates]
  );

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      const { x, y } = getCoordinates(e);
      if (canvasState.currentLine) {
        canvasState.currentLine.points.push({ x, y });
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) {
          updateCanvas(ctx, canvasState, draggedItem, pan, scale);
        }
      }
    },
    [isDrawing, draggedItem, getCoordinates, pan, scale]
  );

  const stopDrawing = useCallback(() => {
    if (isDrawing && canvasState.currentLine) {
      const bounds = calculateBounds([canvasState.currentLine]);
      const newItem = {
        id: `drawing-${Date.now()}`,
        lines: [canvasState.currentLine],
        position: { x: 0, y: 0 },
        bounds: bounds,
        borderColor: "#bebebe",
      };
      canvasState.items.push(newItem);
      canvasState.currentLine = null;
      setIsDrawing(false);
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        updateCanvas(ctx, canvasState, draggedItem, pan, scale);
      }
    }
  }, [isDrawing, draggedItem, pan, scale]);

  const startDragging = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
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
      if (drawingMode) startDrawing(e);
    },
    [drawingMode, startDrawing, getCoordinates]
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
          updateCanvas(ctx, canvasState, draggedItem, pan, scale);
        }
      }
    },
    [isDragging, draggedItem, dragOffset, getCoordinates, pan, scale]
  );

  const stopDragging = useCallback(() => {
    setIsDragging(false);
    setDraggedItem(null);
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      updateCanvas(ctx, canvasState, null, pan, scale);
    }
  }, [pan, scale]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
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
          setSelectedItemPosition({ x: e.clientX, y: e.clientY });
          return;
        }
      }
      setSelectedItem(null);
      setSelectedItemPosition(null);
    },
    [getCoordinates]
  );

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
          updateCanvas(ctx, canvasState, null, pan, scale);
        }
      }
    }
  }, [selectedItem, pan, scale]);

  const toggleDrawingMode = useCallback(() => {
    setDrawingMode((prevMode) => !prevMode);
  }, []);

  const handlePan = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.buttons === 4) {
      setPan((prevPan) => ({
        x: prevPan.x + e.movementX,
        y: prevPan.y + e.movementY,
      }));
    }
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const rect = canvasRef.current?.getBoundingClientRect();
      const mouseX = e.clientX - (rect?.left ?? 0);
      const mouseY = e.clientY - (rect?.top ?? 0);

      setScale((prevScale) => {
        const newScale = prevScale * delta;
        setPan((prevPan) => ({
          x: prevPan.x - mouseX * (newScale - prevScale),
          y: prevPan.y - mouseY * (newScale - prevScale),
        }));
        return newScale;
      });
    }
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!drawingMode) {
        startDragging(e);
      } else {
        startDrawing(e);
      }
    },
    [drawingMode, startDragging, startDrawing]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!drawingMode && isDragging) {
        drag(e);
      } else if (drawingMode && isDrawing) {
        draw(e);
      }
      handlePan(e);
    },
    [drawingMode, isDragging, isDrawing, drag, draw, handlePan]
  );

  const handleMouseUp = useCallback(() => {
    if (!drawingMode && isDragging) {
      stopDragging();
    } else if (drawingMode) {
      stopDrawing();
    }
  }, [drawingMode, isDragging, stopDragging, stopDrawing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.setTransform(scale, 0, 0, scale, pan.x, pan.y);
        updateCanvas(ctx, canvasState, draggedItem, pan, scale);
      }
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [pan, scale, draggedItem]);

  return (
    <div style={{ position: "relative" }}>
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", top: 0, left: 0 }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
      />
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 10,
          display: "flex",
          gap: "10px",
        }}
      >
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
      </div>
      {selectedItem && selectedItemPosition && (
        <button
          style={{
            position: "absolute",
            left: `${selectedItemPosition.x}px`,
            top: `${selectedItemPosition.y}px`,
            zIndex: 10,
          }}
          onClick={moveItemToBack}
        >
          Move to Back
        </button>
      )}
    </div>
  );
};

export default Editor;
