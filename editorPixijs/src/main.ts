import "./style.css";
import { Application } from "pixi.js";

const app = new Application();
await app.init({ background: "#1099bb", resizeTo: window });
document.body.appendChild(app.canvas);
