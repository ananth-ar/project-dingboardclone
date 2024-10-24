import { Graphics, Text, TextStyle } from "pixi.js";

// Constants for chart configuration
const CHART_CONFIG = {
  WIDTH: 200,
  HEIGHT: 100,
  PADDING: 10,
  HISTORY_SIZE: 100,
  BACKGROUND_COLOR: 0x000000,
  BACKGROUND_ALPHA: 0.5,
  LINE_COLOR: 0x00ff00,
  WARNING_COLOR: 0xffff00,
  CRITICAL_COLOR: 0xff0000,
  FPS_THRESHOLDS: {
    GOOD: 55,
    WARNING: 30,
  },
} as const;

export class FPSMeter {
  private frames = 0;
  private lastTime = performance.now();
  private currentFPS = 0;

  measure(): number {
    this.frames++;
    const currentTime = performance.now();

    if (currentTime >= this.lastTime + 1000) {
      this.currentFPS = this.frames;
      this.frames = 0;
      this.lastTime = currentTime;
    }

    return this.currentFPS;
  }
}

export class FPSChart {
  private history: number[] = [];
  graphics: Graphics;
  private fpsText: Text;
  private avgText: Text;
  private minMaxText: Text;
  private backgroundColor: Graphics;

  constructor() {
    // Initialize container graphics
    this.graphics = new Graphics();
    this.backgroundColor = new Graphics();

    // Create text style for FPS display
    const textStyle = new TextStyle({
      fontSize: 12,
      fill: 0xffffff,
      fontFamily: "Arial",
    });

    // Initialize text displays
    this.fpsText = new Text("FPS: --", textStyle);
    this.avgText = new Text("Avg: --", textStyle);
    this.minMaxText = new Text("Min/Max: --/--", textStyle);

    // Position elements
    this.graphics.position.set(
      window.innerWidth - CHART_CONFIG.WIDTH - CHART_CONFIG.PADDING,
      CHART_CONFIG.PADDING
    );

    // Setup text positions
    this.fpsText.position.set(5, 5);
    this.avgText.position.set(5, 20);
    this.minMaxText.position.set(5, 35);

    // Add all elements to the container
    this.graphics.addChild(this.backgroundColor);
    this.graphics.addChild(this.fpsText);
    this.graphics.addChild(this.avgText);
    this.graphics.addChild(this.minMaxText);

    // Add resize handler
    window.addEventListener("resize", this.handleResize.bind(this));

    // Initial draw
    this.drawBackground();
  }

  private handleResize(): void {
    this.graphics.position.set(
      window.innerWidth - CHART_CONFIG.WIDTH - CHART_CONFIG.PADDING,
      CHART_CONFIG.PADDING
    );
  }

  private drawBackground(): void {
    this.backgroundColor.clear();
    this.backgroundColor.beginFill(
      CHART_CONFIG.BACKGROUND_COLOR,
      CHART_CONFIG.BACKGROUND_ALPHA
    );
    this.backgroundColor.drawRect(
      0,
      0,
      CHART_CONFIG.WIDTH,
      CHART_CONFIG.HEIGHT
    );
    this.backgroundColor.endFill();
  }

  private getLineColor(fps: number): number {
    if (fps <= CHART_CONFIG.FPS_THRESHOLDS.WARNING) {
      return CHART_CONFIG.CRITICAL_COLOR;
    } else if (fps <= CHART_CONFIG.FPS_THRESHOLDS.GOOD) {
      return CHART_CONFIG.WARNING_COLOR;
    }
    return CHART_CONFIG.LINE_COLOR;
  }

  update(fps: number): void {
    // Update history
    this.history.push(fps);
    if (this.history.length > CHART_CONFIG.HISTORY_SIZE) {
      this.history.shift();
    }

    // Calculate statistics
    const avg = Math.round(
      this.history.reduce((sum, val) => sum + val, 0) / this.history.length
    );
    const min = Math.min(...this.history);
    const max = Math.max(...this.history);

    // Update text displays
    this.fpsText.text = `FPS: ${fps}`;
    this.avgText.text = `Avg: ${avg}`;
    this.minMaxText.text = `Min/Max: ${min}/${max}`;

    // Draw the chart
    this.drawChart();
  }

  private drawChart(): void {
    const g = new Graphics();

    // Draw the line chart
    g.lineStyle(1, this.getLineColor(this.history[this.history.length - 1]));

    const drawHeight = CHART_CONFIG.HEIGHT - 50; // Leave room for text
    const pointWidth = CHART_CONFIG.WIDTH / CHART_CONFIG.HISTORY_SIZE;

    this.history.forEach((fps, i) => {
      const x = i * pointWidth;
      const y = drawHeight - (fps / 60) * drawHeight;

      if (i === 0) {
        g.moveTo(x, y);
      } else {
        g.lineTo(x, y);
      }
    });

    // Remove old chart if it exists (keeping text and background)
    if (this.graphics.children.length > 4) {
      this.graphics.removeChildAt(4);
    }

    // Add new chart
    this.graphics.addChild(g);
  }

  destroy(): void {
    window.removeEventListener("resize", this.handleResize.bind(this));
    this.graphics.destroy();
  }
}
