"use client";
import React, { use, useEffect } from "react";

const InfiniteCanvas = () => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // ctx.fillStyle = "#FF0000";
      // ctx.fillRect(50, 10, 90, 90);

      // ctx.save();
      // ctx.translate(90, 50);
      // ctx.fillStyle = "#000000";
      // ctx.fillRect(50, 10, 100, 100);
      // ctx.restore();

      // Start a path
      ctx.beginPath();
      ctx.moveTo(50, 50);  
      ctx.lineTo(100, 100);

      ctx.save(); // Save the current state
      ctx.strokeStyle = "red"; // Change some properties
      ctx.lineWidth = 5;
      ctx.lineTo(150, 50); // Add to the path
      ctx.stroke(); // Stroke the path
      ctx.restore(); // Restore the saved state

      // The path still exists, but we're back to default styles
      ctx.lineTo(200, 100);
      ctx.stroke();

      console.log("draw");
    };

    draw();
  }, []);

  return (
    <div>
      <canvas
        style={{ border: "1px solid black" }}
        height={800}
        width={1000}
        ref={canvasRef}
      />
    </div>
  );
};

export default InfiniteCanvas;
