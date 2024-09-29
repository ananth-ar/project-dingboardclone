import React, { useRef, useEffect, useState, useCallback } from "react";

interface Point {
  x: number;
  y: number;
}

interface Line {
  points: Point[];
  color: string;
}

interface CanvasState {
  lines: Line[];
  currentLine: Line | null;
}

const canvasState: CanvasState = {
  lines: [],
  currentLine: null,
};

const updateCanvas = (
  ctx: CanvasRenderingContext2D,
  state: CanvasState
): void => {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  [...state.lines, state.currentLine].forEach((line) => {
    if (line && line.points.length > 1) {
      ctx.beginPath();
      ctx.moveTo(line.points[0].x, line.points[0].y);
      for (let i = 1; i < line.points.length; i++) {
        ctx.lineTo(line.points[i].x, line.points[i].y);
      }
      ctx.strokeStyle = line.color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  });
};

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [color, setColor] = useState<string>("#000000");
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

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
          updateCanvas(ctx, canvasState);
        }
      }
    },
    [isDrawing]
  );

  const stopDrawing = useCallback(() => {
    if (isDrawing && canvasState.currentLine) {
      canvasState.lines.push(canvasState.currentLine);
      canvasState.currentLine = null;
      setIsDrawing(false);
    }
  }, [isDrawing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      startDrawing(e as unknown as React.MouseEvent<HTMLCanvasElement>);
    };

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      draw(e as unknown as React.MouseEvent<HTMLCanvasElement>);
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      stopDrawing();
    };

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mouseout", handleMouseUp);

    updateCanvas(ctx, canvasState);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mouseout", handleMouseUp);
    };
  }, [startDrawing, draw, stopDrawing]);

  
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

export default App;
