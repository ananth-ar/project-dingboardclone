"use client";
import React, { useRef, useEffect, useState, MouseEvent } from "react";

interface PanOffset {
  x: number;
  y: number;
}

interface MousePosition {
  x: number;
  y: number;
}

const CanvasPathDemo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panOffset, setPanOffset] = useState<PanOffset>({ x: 0, y: 0 });
  const lastMousePosRef = useRef<MousePosition>({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(panOffset.x, panOffset.y);

      // Original path drawing code
      ctx.beginPath();
      ctx.moveTo(50, 50);
      ctx.lineTo(100, 100);

      ctx.save();

      ctx.strokeStyle = "red";
      ctx.lineWidth = 5;

      ctx.lineTo(150, 50);

      ctx.stroke();

      ctx.restore();

      ctx.lineTo(200, 100);
      ctx.stroke();

      ctx.restore();
    };

    draw();
  }, [panOffset]);

  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    setIsPanning(true);
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!isPanning) return;

    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;

    setPanOffset((prev: PanOffset) => ({
      x: prev.x + dx,
      y: prev.y + dy,
    }));

    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      style={{
        border: "1px solid black",
        cursor: isPanning ? "grabbing" : "grab",
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  );
};

export default CanvasPathDemo;