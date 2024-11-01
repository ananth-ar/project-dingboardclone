// src/main.ts
import { Application } from "pixi.js";
import { FPSMeter, FPSChart } from "./fps";
import "./style.css";
import { InfiniteCanvas } from "./infinitecanvas";
import { initDevtools } from "@pixi/devtools";

async function initializeApp() {
  try {
    const app = new Application();

    await app.init({
      background: "#1099bb",
      resizeTo: window,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true, // Handles high DPI displays better
    });

    const appContainer = document.querySelector<HTMLDivElement>("#app");
    if (!appContainer) throw new Error("#app element not found");

    appContainer.appendChild(app.canvas);
    initDevtools({ app });
    // Create and add the infinite canvas
    const canvas = new InfiniteCanvas(app);
    app.stage.addChild(canvas);

    // Setup window resize handler
    window.addEventListener("resize", () => {
      app.renderer.resize(window.innerWidth, window.innerHeight);
    });

    // Setup image upload
    setupImageUpload(canvas);

    // Initialize FPS monitoring system
    const fpsMeter = new FPSMeter();
    const fpsChart = new FPSChart();
    app.stage.addChild(fpsChart.graphics);

    // Start the FPS monitoring
    app.ticker.add(() => {
      const currentFPS = fpsMeter.measure();
      fpsChart.update(currentFPS);
    });

    return app;
  } catch (error) {
    console.error("Failed to initialize PixiJS application:", error);
    throw error;
  }
}

function setupImageUpload(canvas: InfiniteCanvas) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.style.position = "fixed";
  input.style.top = "10px";
  input.style.left = "10px";

  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      try {
        await canvas.addImageFromFile(file);
        // Reset input value to allow same file selection
        input.value = "";
      } catch (error) {
        console.error("Error adding image:", error);
        // Here you could add user feedback for errors
      }
    }
  };

  document.body.appendChild(input);
}

// Initialize the application
const appInstance = await initializeApp();

export { appInstance as app };
