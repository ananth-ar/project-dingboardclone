"use client";
import React, { useRef, useEffect, useState, useCallback } from "react";
import TextCustomizer, { measureTextBounds, TextData } from "./TextCustomizer";

interface Point {
  x: number;
  y: number;
}

interface Line {
  points: Point[];
  color: string;
}

interface BaseItem {
  id: string;
  type: "drawing" | "image" | "text";
  position: Point;
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
  // rotation: number;
  // scale: number;
}

interface DrawingItem extends BaseItem {
  type: "drawing";
  lines: Line[];
}

interface ImageItem extends BaseItem {
  type: "image";
  element: HTMLImageElement;
  originalHeight: number;
  originalWidth: number;
}

export interface TextItem extends BaseItem {
  type: "text";
  textdata: TextData;
}

type CanvasItem = ImageItem | TextItem;

export interface CanvasState {
  items: CanvasItem[];
  currentLine: Line | null;
  history: CanvasItem[][];
  historyIndex: number;
}

const BORDER_WIDTH = 0.5;
const BORDER_PADDING = 1;

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

const drawBorder = (
  ctx: CanvasRenderingContext2D,
  item: CanvasItem,
  highlightcolor?: string
) => {
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
  if (highlightcolor) {
    ctx.strokeStyle = highlightcolor;
    ctx.lineWidth = BORDER_WIDTH * 2;
    ctx.stroke();
  } else {
    ctx.strokeStyle = "violet";
    ctx.lineWidth = BORDER_WIDTH;
    ctx.stroke();
  }
};

const drawText = (ctx: CanvasRenderingContext2D, data: TextItem) => {
  ctx.font = `${data.textdata.fontStyle} ${data.textdata.fontSize}px ${data.textdata.fontFamily}`;
  ctx.fillStyle = data.textdata.fillStyle;
  ctx.strokeStyle = data.textdata.strokeStyle;
  ctx.lineWidth = data.textdata.lineWidth;
  ctx.shadowColor = data.textdata.shadowColor;
  ctx.shadowBlur = data.textdata.shadowBlur;
  ctx.shadowOffsetX = data.textdata.shadowOffsetX;
  ctx.shadowOffsetY = data.textdata.shadowOffsetY;
  ctx.textAlign = data.textdata.textAlign;
  ctx.textBaseline = data.textdata.textBaseline;

  if (data.textdata.useStroke) {
    ctx.strokeText(data.textdata.text, data.position.x, data.position.y);
  }
  ctx.fillText(data.textdata.text, data.position.x, data.position.y);
};

const updateCanvas = (
  ctx: CanvasRenderingContext2D,
  state: CanvasState,
  draggedItemId: string | null
): void => {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();

  state.items.forEach((item) => {
    if (item.type === "image")
      ctx.drawImage(item.element, item.position.x, item.position.y);
    else if (item.type === "text") drawText(ctx, item);

    drawBorder(ctx, item);
    if (item.id === draggedItemId) drawBorder(ctx, item, "red");
  });
  if (state.currentLine) {
    drawLine(ctx, state.currentLine, 0, 0);
  }
};

const Editor = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const canvasStateRef = useRef<CanvasState>({
    items: [],
    currentLine: null,
    history: [],
    historyIndex: 0,
  });
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
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const [showItemOptions, setShowItemOptions] = useState<boolean>(false);

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
      canvasStateRef.current.currentLine = { points: [{ x, y }], color };
      setIsDrawing(true);
    },
    [color, getCoordinates]
  );

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      const { x, y } = getCoordinates(e);
      if (canvasStateRef.current.currentLine) {
        canvasStateRef.current.currentLine.points.push({ x, y });
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) {
          requestAnimationFrame(() =>
            updateCanvas(ctx, canvasStateRef.current, draggedItem)
          );
        }
      }
    },
    [isDrawing, draggedItem, getCoordinates, pan, scale]
  );

  const stopDrawing = useCallback(() => {
    if (isDrawing && canvasStateRef.current.currentLine) {
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        const imageItem = canvasStateRef.current.items.find(
          (item) => item.id === selectedItem
        );
        if (!imageItem) return;
        if (imageItem.type !== "image") return;

        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");
        if (!tempCtx) return;
        tempCanvas.width = imageItem.bounds.maxX - imageItem.bounds.minX;
        tempCanvas.height = imageItem.bounds.maxY - imageItem.bounds.minY;

        tempCtx.drawImage(
          imageItem.element,
          0,
          0,
          tempCanvas.width,
          tempCanvas.height
        );

        if (canvasStateRef.current.currentLine) {
          drawLine(
            tempCtx,
            canvasStateRef.current.currentLine,
            -imageItem.position.x - imageItem.bounds.minX,
            -imageItem.position.y - imageItem.bounds.minY
          );
        }

        const newImage = new Image();
        newImage.src = tempCanvas.toDataURL();

        const newImageItem: ImageItem = {
          ...imageItem,
          element: newImage,
        };

        const itemIndex = canvasStateRef.current.items.findIndex(
          (item) => item.id === imageItem.id
        );

        canvasStateRef.current.currentLine = null;
        console.log("before adding", canvasStateRef.current);
        // if (
        //   canvasStateRef.current.historyIndex <
        //   canvasStateRef.current.history.length
        // ) {
        //   canvasStateRef.current.items = canvasStateRef.current.items.slice(
        //     0,
        //     -canvasStateRef.current.history.length -
        //       canvasStateRef.current.historyIndex
        //   );
        //   console.log("inside remove", canvasStateRef.current.items);
        // }
        if (canvasStateRef.current.history.length < 1) {
          canvasStateRef.current.history.push(canvasStateRef.current.items);
          canvasStateRef.current.historyIndex++;
          console.log("pushing with noline ", canvasStateRef.current.items);
        }
        if (itemIndex !== -1)
          canvasStateRef.current.items[itemIndex] = newImageItem;

        canvasStateRef.current.history.push(canvasStateRef.current.items);
        canvasStateRef.current.historyIndex++;
        console.log("after adding", canvasStateRef.current);
        setIsDrawing(false);
        requestAnimationFrame(() =>
          updateCanvas(ctx, canvasStateRef.current, draggedItem)
        );
      }
    }
  }, [isDrawing, draggedItem]);

  const startDragging = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const { x, y } = getCoordinates(e);
      for (let i = canvasStateRef.current.items.length - 1; i >= 0; i--) {
        const item = canvasStateRef.current.items[i];
        if (
          x >= item.position.x + item.bounds.minX - BORDER_PADDING &&
          x <= item.position.x + item.bounds.maxX + BORDER_PADDING &&
          y >= item.position.y + item.bounds.minY - BORDER_PADDING &&
          y <= item.position.y + item.bounds.maxY + BORDER_PADDING
        ) {
          setIsDragging(true);
          setDraggedItem(item.id);
          console.log("x y ", x - item.position.x, y - item.position.y);
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
      const itemIndex = canvasStateRef.current.items.findIndex(
        (item) => item.id === draggedItem
      );
      if (itemIndex !== -1) {
        canvasStateRef.current.items[itemIndex].position = {
          x: x - dragOffset.x,
          y: y - dragOffset.y,
        };
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) {
          requestAnimationFrame(() =>
            updateCanvas(ctx, canvasStateRef.current, draggedItem)
          );
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
      requestAnimationFrame(() =>
        updateCanvas(ctx, canvasStateRef.current, null)
      );
    }
  }, [pan, scale]);

  const createText = (state: TextData) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const x = Math.random() * (1000 - 100);
    const y = Math.random() * (1000 - 100);
    canvasStateRef.current.items.push({
      id: `text-${Date.now()}`,
      type: "text",
      textdata: state,
      position: {
        x: 10,
        y: 10,
      },
      bounds: measureTextBounds(ctx, {
        text: state.text,
        x,
        y,
        fontSize: state.fontSize,
        fontFamily: state.fontFamily,
        fontStyle: state.fontStyle,
        textAlign: state.textAlign,
        textBaseline: state.textBaseline,
      }),
    });
    requestAnimationFrame(() =>
      updateCanvas(ctx, canvasStateRef.current, null)
    );
  };

  const moveItemToBack = useCallback(() => {
    if (selectedItem) {
      const itemIndex = canvasStateRef.current.items.findIndex(
        (item) => item.id === selectedItem
      );
      if (itemIndex !== -1) {
        const [item] = canvasStateRef.current.items.splice(itemIndex, 1);
        canvasStateRef.current.items.unshift(item);
        setSelectedItem(null);
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) {
          requestAnimationFrame(() =>
            updateCanvas(ctx, canvasStateRef.current, null)
          );
        }
      }
    }
  }, [selectedItem, pan, scale]);

  const toggleDrawingMode = useCallback(() => {
    setDrawingMode((prevMode) => !prevMode);
  }, []);

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      const img = new Image();
      img.onload = () => {
        const newImageItem: ImageItem = {
          element: img,
          type: "image",
          id: `image-${Date.now()}`,
          position: {
            x: Math.random() * (1000 - 100),
            y: Math.random() * (1000 - 100),
          },
          bounds: {
            minX: 0,
            minY: 0,
            maxX: img.width,
            maxY: img.height,
          },
          originalHeight: img.height,
          originalWidth: img.width,
        };
        canvasStateRef.current.items.push(newImageItem);
        console.log("just added a image ", canvasStateRef.current.items);
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) {
          requestAnimationFrame(() =>
            updateCanvas(ctx, canvasStateRef.current, null)
          );
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleUndo = (num: 1 | -1) => {
    // canvasStateRef.current.historyIndex += num;

    // if (
    //   canvasStateRef.current.historyIndex < 0 ||
    //   canvasStateRef.current.historyIndex >=
    //     canvasStateRef.current.history.length
    // )
    //   return;

    canvasStateRef.current.items = canvasStateRef.current.history[0];
    // console.log(
    //   "after undo",
    //   canvasStateRef.current.historyIndex - 1,
    //   canvasStateRef.current
    // );
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) {
      requestAnimationFrame(() =>
        updateCanvas(ctx, canvasStateRef.current, null)
      );
    }
  };

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const { x, y } = getCoordinates(e);
      for (let i = canvasStateRef.current.items.length - 1; i > -1; i--) {
        const item = canvasStateRef.current.items[i];
        if (
          x >= item.position.x + item.bounds.minX - BORDER_PADDING &&
          x <= item.position.x + item.bounds.maxX + BORDER_PADDING &&
          y >= item.position.y + item.bounds.minY - BORDER_PADDING &&
          y <= item.position.y + item.bounds.maxY + BORDER_PADDING
        ) {
          setSelectedItem(item.id);
          setSelectedItemPosition({ x: e.clientX, y: e.clientY });
          setShowItemOptions(true);
          return;
        }
      }
    },
    [getCoordinates]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!drawingMode) {
        startDragging(e);
      } else {
        const item = canvasStateRef.current.items.find(
          (item) => item.id === selectedItem
        );
        if (!item) return;
        const { x, y } = getCoordinates(e);
        if (
          x >= item.position.x + item.bounds.minX - BORDER_PADDING &&
          x <= item.position.x + item.bounds.maxX + BORDER_PADDING &&
          y >= item.position.y + item.bounds.minY - BORDER_PADDING &&
          y <= item.position.y + item.bounds.maxY + BORDER_PADDING
        )
          startDrawing(e);
      }
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    },
    [drawingMode, startDragging, startDrawing]
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      if (e.ctrlKey) {
        const zoomIntensity = 0.1;
        const wheel = e.deltaY < 0 ? 1 : -1;
        const zoom = Math.exp(wheel * zoomIntensity);

        const rect = canvasRef.current?.getBoundingClientRect();
        const x = e.clientX - (rect?.left ?? 0);
        const y = e.clientY - (rect?.top ?? 0);

        setScale((prevScale) => prevScale * zoom);
        setPan((prevPan) => ({
          x: x - (x - prevPan.x) * zoom,
          y: y - (y - prevPan.y) * zoom,
        }));
      }
    },
    [scale, pan]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!drawingMode && isDragging) {
        drag(e);
      } else if (drawingMode && isDrawing) {
        const item = canvasStateRef.current.items.find(
          (item) => item.id === selectedItem
        );
        if (!item) return;
        const { x, y } = getCoordinates(e);
        if (
          x >= item.position.x + item.bounds.minX - BORDER_PADDING &&
          x <= item.position.x + item.bounds.maxX + BORDER_PADDING &&
          y >= item.position.y + item.bounds.minY - BORDER_PADDING &&
          y <= item.position.y + item.bounds.maxY + BORDER_PADDING
        )
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
    const ctx = canvas.getContext("2d");

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (ctx) {
        ctx.setTransform(scale, 0, 0, scale, pan.x, pan.y);
        requestAnimationFrame(() =>
          updateCanvas(ctx, canvasStateRef.current, draggedItem)
        );
      }
    };

    const preventZoom = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
      }
    };

    window.addEventListener("wheel", preventZoom, { passive: false });
    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("wheel", preventZoom);
    };
  }, [pan, scale, draggedItem]);

  return (
    <div className="relative ">
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
      />
      <div className="absolute top-[10px] left-1/2 transform -translate-x-1/2 z-10 flex gap-2.5">
        {showItemOptions && (
          <button onClick={toggleDrawingMode}>
            {drawingMode ? "Stop Drawing" : "Draw"}
          </button>
        )}
        <input
          type="color"
          value={color}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setColor(e.target.value)
          }
        />
        <label
          htmlFor="imageUpload"
          className="cursor-pointer bg-blue-500 text-white rounded-full px-2 hover:bg-blue-600 transition-colors"
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
        <TextCustomizer createText={createText} />
        <div className="mx-4">
          <button
            className="px-1 mx-1 bg-indigo-600 text-white disabled:bg-indigo-800"
            onClick={() => handleUndo(-1)}
            disabled={canvasStateRef.current.historyIndex === 0}
          >
            Undo
          </button>
          <button
            className="px-1 mx-1 bg-indigo-600 text-white disabled:bg-indigo-950"
            onClick={() => handleUndo(1)}
            disabled={
              canvasStateRef.current.historyIndex ===
              canvasStateRef.current.history.length - 1
            }
          >
            Redo
          </button>
        </div>
      </div>
      <div className="absolute bottom-4 right-4"></div>
      {selectedItem && selectedItemPosition && (
        <button
          className="absolute z-10"
          style={{
            left: `${selectedItemPosition.x}px`,
            top: `${selectedItemPosition.y}px`,
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
