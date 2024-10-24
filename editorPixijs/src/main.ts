// main.ts
import { FPSMeter, FPSChart } from "./fps";
import "./style.css";
import { Application } from "pixi.js";

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

    window.addEventListener("resize", () => {
      app.renderer.resize(window.innerWidth, window.innerHeight);
    });

    return app;
  } catch (error) {
    console.error("Failed to initialize PixiJS application:", error);
    throw error;
  }
}


const appInstance = await initializeApp();

// Initialize FPS monitoring system
const fpsMeter = new FPSMeter();
const fpsChart = new FPSChart();
appInstance.stage.addChild(fpsChart.graphics);
// Start the FPS monitoring
appInstance.ticker.add(() => {
  const currentFPS = fpsMeter.measure();
  fpsChart.update(currentFPS);
});


export { appInstance as app };
