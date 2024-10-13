import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CanvasState } from "./SAMPLE";

type FontStyle = "normal" | "italic" | "bold";
type FontFamily = "Arial" | "Verdana" | "Times New Roman";

interface TextBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

interface TextMeasurementProps {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  fontStyle?: string;
  textAlign?: CanvasTextAlign;
  textBaseline?: CanvasTextBaseline;
}

export function measureTextBounds(
  ctx: CanvasRenderingContext2D,
  props: TextMeasurementProps
): TextBounds {
  const {
    text,
    x,
    y,
    fontSize,
    fontFamily,
    fontStyle = "",
    textAlign = "left",
    textBaseline = "alphabetic",
  } = props;

  // Set the font before measuring
  ctx.font = `${fontStyle} ${fontSize}px ${fontFamily}`;
  ctx.textAlign = textAlign;
  ctx.textBaseline = textBaseline;

  const metrics = ctx.measureText(text);

  // Get the width
  const width = metrics.width;

  // Estimate height (this is an approximation)
  const height = fontSize * 1.2; // Multiplier can be adjusted based on your font

  // Calculate vertical metrics
  const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.8;
  const descent = metrics.actualBoundingBoxDescent || fontSize * 0.2;

  // Calculate bounds based on alignment and baseline
  let minX: number, minY: number, maxX: number, maxY: number;

  switch (textAlign) {
    case "center":
      minX = x - width / 2;
      maxX = x + width / 2;
      break;
    case "right":
      minX = x - width;
      maxX = x;
      break;
    default: // 'left' or 'start'
      minX = x;
      maxX = x + width;
  }

  switch (textBaseline) {
    case "top":
    case "hanging":
      minY = y;
      maxY = y + height;
      break;
    case "middle":
      minY = y - height / 2;
      maxY = y + height / 2;
      break;
    case "bottom":
    case "ideographic":
      minY = y - height;
      maxY = y;
      break;
    default: // 'alphabetic' or 'normal'
      minY = y - ascent;
      maxY = y + descent;
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width,
    height,
  };
}

export interface TextData {
  text: string;
  fontFamily: FontFamily;
  fontSize: number;
  fontStyle: FontStyle;
  fillStyle: string;
  strokeStyle: string;
  lineWidth: number;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
  canvasCenterX: number;
  canvasCenterY: number;
  useStroke: boolean;
}

export const drawText = (ctx: CanvasRenderingContext2D, data: TextData) => {
  ctx.font = `${data.fontStyle} ${data.fontSize}px ${data.fontFamily}`;
  ctx.fillStyle = data.fillStyle;
  ctx.strokeStyle = data.strokeStyle;
  ctx.lineWidth = data.lineWidth;
  ctx.shadowColor = data.shadowColor;
  ctx.shadowBlur = data.shadowBlur;
  ctx.shadowOffsetX = data.shadowOffsetX;
  ctx.shadowOffsetY = data.shadowOffsetY;
  ctx.textAlign = data.textAlign;
  ctx.textBaseline = data.textBaseline;

  if (data.useStroke) {
    ctx.strokeText(data.text, data.canvasCenterX, data.canvasCenterY);
  }
  ctx.fillText(data.text, data.canvasCenterX, data.canvasCenterY);
};

const TextCustomizer = ({
  createText,
}: {
  createText: (state: TextData) => void;
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [state, setState] = useState<TextData>({
    text: "",
    fontFamily: "Arial",
    fontSize: 16,
    fontStyle: "normal",
    fillStyle: "#000000",
    strokeStyle: "#000000",
    lineWidth: 1,
    shadowColor: "#000000",
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    textAlign: "center",
    textBaseline: "middle",
    canvasCenterX: 200,
    canvasCenterY: 100,
    useStroke: false,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawText(ctx, state);
  }, [state]);

  const handleInputChange = <K extends keyof TextData>(
    key: K,
    value: TextData[K]
  ) => {
    setState((prevState) => ({ ...prevState, [key]: value }));
  };

  const handleCreate = () => {
    createText(state);
    setIsOpen(false);
  };

  return (
    <>
      <Button onClick={() => setIsOpen(!isOpen)}>Create Text</Button>
      {isOpen && (
        <div className="mt-4 p-4 border rounded-md">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="text">Text</Label>
              <Input
                id="text"
                value={state.text}
                onChange={(e) => handleInputChange("text", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="fontFamily">Font Family</Label>
              <Select
                value={state.fontFamily}
                onValueChange={(value: FontFamily) =>
                  handleInputChange("fontFamily", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Verdana">Verdana</SelectItem>
                  <SelectItem value="Times New Roman">
                    Times New Roman
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fontSize">Font Size</Label>
              <Input
                id="fontSize"
                type="number"
                value={state.fontSize}
                onChange={(e) =>
                  handleInputChange("fontSize", Number(e.target.value))
                }
              />
            </div>
            <div>
              <Label htmlFor="fontStyle">Font Style</Label>
              <Select
                value={state.fontStyle}
                onValueChange={(value: FontStyle) =>
                  handleInputChange("fontStyle", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="italic">Italic</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fillStyle">Fill Color</Label>
              <Input
                id="fillStyle"
                type="color"
                value={state.fillStyle}
                onChange={(e) => handleInputChange("fillStyle", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="strokeStyle">Stroke Color</Label>
              <Input
                id="strokeStyle"
                type="color"
                value={state.strokeStyle}
                onChange={(e) =>
                  handleInputChange("strokeStyle", e.target.value)
                }
              />
            </div>
            <div>
              <Label htmlFor="shadowColor">Shadow Color</Label>
              <Input
                id="shadowColor"
                type="color"
                value={state.shadowColor}
                onChange={(e) =>
                  handleInputChange("shadowColor", e.target.value)
                }
              />
            </div>
            <div>
              <Label htmlFor="shadowBlur">Shadow Blur</Label>
              <Input
                id="shadowBlur"
                type="number"
                value={state.shadowBlur}
                onChange={(e) =>
                  handleInputChange("shadowBlur", Number(e.target.value))
                }
              />
            </div>
            <div>
              <Label htmlFor="shadowOffsetX">Shadow Offset X</Label>
              <Input
                id="shadowOffsetX"
                type="number"
                value={state.shadowOffsetX}
                onChange={(e) =>
                  handleInputChange("shadowOffsetX", Number(e.target.value))
                }
              />
            </div>
            <div>
              <Label htmlFor="shadowOffsetY">Shadow Offset Y</Label>
              <Input
                id="shadowOffsetY"
                type="number"
                value={state.shadowOffsetY}
                onChange={(e) =>
                  handleInputChange("shadowOffsetY", Number(e.target.value))
                }
              />
            </div>
            <div>
              <Label htmlFor="useStroke">Use Stroke</Label>
              <Input
                id="useStroke"
                type="checkbox"
                checked={state.useStroke}
                onChange={(e) =>
                  handleInputChange("useStroke", e.target.checked)
                }
              />
            </div>
            <div>
              <Label htmlFor="lineWidth">Stroke Width</Label>
              <Input
                id="lineWidth"
                type="number"
                value={state.lineWidth}
                onChange={(e) =>
                  handleInputChange("lineWidth", Number(e.target.value))
                }
                min="1"
              />
            </div>
          </div>
          <Button className="mt-4" onClick={handleCreate}>
            Create
          </Button>
          <canvas
            ref={canvasRef}
            width="400"
            height="200"
            className="border mt-4"
          />
        </div>
      )}
    </>
  );
};

export default TextCustomizer;
