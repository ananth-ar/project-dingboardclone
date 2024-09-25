import express, { Request, Response } from "express";
import path from "path";

const app = express();

app.use(express.static("public"));
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/editor/dist/index.html"));
});

app.get("/dashboard", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dashboard/index.html"));
});

app.use("/test", (req: Request, res: Response) => {
  res.send("Hello, TypeScript with Express!");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
