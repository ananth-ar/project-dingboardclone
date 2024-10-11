"use client";
import React, { useRef, useEffect, useState, useCallback } from "react";

const drawScene = (ctx: CanvasRenderingContext2D) => {
  // Your scene drawing code here
  ctx.save();
  ctx.translate(50, 50);
  ctx.beginPath();
  ctx.moveTo(50, 50);
  ctx.lineTo(100, 100);
  ctx.lineTo(150, 50);
  ctx.lineTo(200, 100);
  ctx.strokeStyle = "red";
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.restore();
};


const CanvasPathDemo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const [scale, setScale] = useState<number>(1);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const offscreenCanvas = offscreenCanvasRef.current;
    if (!canvas || !offscreenCanvas) return;

    const ctx = canvas.getContext("2d");
    const offscreenCtx = offscreenCanvas.getContext("2d");
    if (!ctx || !offscreenCtx) return;

    // Clear the offscreen canvas
    offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

    // Draw on the offscreen canvas
    offscreenCtx.save();
    offscreenCtx.transform(scale, 0, 0, scale, pan.x, pan.y);
    drawScene(offscreenCtx);
    offscreenCtx.restore();

    // Copy the offscreen canvas to the main canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(offscreenCanvas, 0, 0);
  }, [pan, drawScene]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Create offscreen canvas
    const offscreenCanvas = document.createElement("canvas");
    offscreenCanvas.width = canvas.width;
    offscreenCanvas.height = canvas.height;
    offscreenCanvasRef.current = offscreenCanvas;
    const preventZoom = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };
    canvas.addEventListener("wheel", preventZoom, { passive: false });

    draw();

    return () => {
      canvas.removeEventListener("wheel", preventZoom);
    };
  }, [draw]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsPanning(true);
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isPanning) return;

    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    setPan((prevOffset) => ({
      x: prevOffset.x + dx,
      y: prevOffset.y + dy,
    }));

    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };


  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      if (e.ctrlKey) {
        const zoomIntensity = 0.1;
        const wheel = e.deltaY < 0 ? 1 : -1;
        const zoom = Math.exp(wheel * zoomIntensity);

        const rect = canvasRef.current?.getBoundingClientRect();
        const x = e.clientX - (rect?.left ?? 0);
        const y = e.clientY - (rect?.top ?? 0);

        setScale((prevScale) => {
          const newScale = prevScale * zoom;
          return newScale;
        });

        setPan((prevPan) => ({
          x: x - (x - prevPan.x) * zoom,
          y: y - (y - prevPan.y) * zoom,
        }));
      }
    },
    [scale, pan]
  );

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        style={{
          cursor: isPanning ? "grabbing" : "grab",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
    </>
  );
};

export default CanvasPathDemo;
