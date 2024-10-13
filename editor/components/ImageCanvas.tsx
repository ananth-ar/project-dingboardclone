"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";

interface Image {
  element: HTMLImageElement;
  x: number;
  y: number;
}

interface Pan {
  x: number;
  y: number;
}

const ImageCanvas = () => {
  const [images, setImages] = useState<Image[]>([]);
  const [pan, setPan] = useState<Pan>({ x: 0, y: 0 });
  const [scale, setScale] = useState<number>(1);
  //   const [isDragging, setIsDragging] = useState<boolean>(false);
  //   const [dragStart, setDragStart] = useState<Pan>({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(scale, scale);
    images.forEach((img) => {
      ctx.drawImage(img.element, img.x, img.y);
    });
    ctx.restore();

    const preventZoom = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };
    canvas.addEventListener("wheel", preventZoom, { passive: false });
    return () => {
      canvas.removeEventListener("wheel", preventZoom);
    };
  }, [images, pan, scale]);

  const handlePan = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.buttons === 4) {
      const dx = e.clientX - lastMousePosRef.current.x;
      const dy = e.clientY - lastMousePosRef.current.y;
      setPan((prevOffset) => ({
        x: prevOffset.x + dx,
        y: prevOffset.y + dy,
      }));

      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    const scaleFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((prevScale) => prevScale * scaleFactor);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {};

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {};

  const handleMouseUp = () => {};

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      const img = new Image();
      img.onload = () => {
        setImages((prevImages) => [
          ...prevImages,
          {
            id: Date.now(),
            element: img,
            x: Math.random() * (1000 - 100),
            y: Math.random() * (1000 - 100),
          },
        ]);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="cursor-move"
      />
      <div className="absolute bottom-4 right-4">
        <label
          htmlFor="imageUpload"
          className="cursor-pointer bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors"
        >
          upload
        </label>
        <input
          id="imageUpload"
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>
    </div>
  );
};

export default ImageCanvas;
