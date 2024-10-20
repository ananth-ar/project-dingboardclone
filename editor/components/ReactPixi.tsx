"use client";
import React, { useState, useCallback, useRef, useMemo } from "react";
import { Stage, Sprite, Container, AppProvider } from "@pixi/react";
import * as PIXI from "pixi.js";

interface ImageObject {
  id: number;
  src: string;
  x: number;
  y: number;
}

interface Position {
  x: number;
  y: number;
}

const CanvasContent: React.FC<{ images: ImageObject[] }> = ({ images }) => {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [lastPosition, setLastPosition] = useState<Position>({ x: 0, y: 0 });
  const containerRef = useRef<PIXI.Container | null>(null);

  const handleDragStart = useCallback((event: PIXI.FederatedPointerEvent) => {
    setIsDragging(true);
    setLastPosition({ x: event.global.x, y: event.global.y });
  }, []);

  const handleDragMove = useCallback(
    (event: PIXI.FederatedPointerEvent) => {
      if (isDragging && containerRef.current) {
        const newPosition = event.global;
        const dx = newPosition.x - lastPosition.x;
        const dy = newPosition.y - lastPosition.y;

        containerRef.current.position.x += dx;
        containerRef.current.position.y += dy;

        setLastPosition({ x: newPosition.x, y: newPosition.y });
      }
    },
    [isDragging, lastPosition]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <Container
      ref={containerRef}
      interactive={true}
      pointerdown={handleDragStart}
      pointermove={handleDragMove}
      pointerup={handleDragEnd}
      pointerupoutside={handleDragEnd}
    >
      {images.map((image) => (
        <Sprite
          key={image.id}
          image={image.src}
          x={image.x}
          y={image.y}
          anchor={0.5}
          interactive={true}
          pointerdown={(event: PIXI.FederatedPointerEvent) => {
            const sprite = event.currentTarget as PIXI.Sprite;
            sprite.alpha = 0.5;
            sprite.data = { dragging: true, eventData: event };
          }}
          pointerup={(event: PIXI.FederatedPointerEvent) => {
            const sprite = event.currentTarget as PIXI.Sprite;
            sprite.alpha = 1;
            sprite.data = null;
          }}
          pointerupoutside={(event: PIXI.FederatedPointerEvent) => {
            const sprite = event.currentTarget as PIXI.Sprite;
            sprite.alpha = 1;
            sprite.data = null;
          }}
          pointermove={(event: PIXI.FederatedPointerEvent) => {
            const sprite = event.currentTarget as PIXI.Sprite;
            if (sprite.data && sprite.data.dragging) {
              const newPosition = event.data.getLocalPosition(sprite.parent);
              sprite.x = newPosition.x;
              sprite.y = newPosition.y;
            }
          }}
        />
      ))}
    </Container>
  );
};

const InfiniteCanvas: React.FC = () => {
  const [images, setImages] = useState<ImageObject[]>([]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const result = e.target?.result;
        if (typeof result === "string") {
          setImages((prevImages) => [
            ...prevImages,
            { id: Date.now(), src: result, x: 0, y: 0 },
          ]);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const app = useMemo(
    () =>
      new PIXI.Application({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0xa25aaa,
      }),
    []
  );

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileUpload} />
      <AppProvider value={app}>
        <Stage options={{ backgroundAlpha: 0 }}>
          <CanvasContent images={images} />
        </Stage>
      </AppProvider>
    </div>
  );
};

export default InfiniteCanvas;
