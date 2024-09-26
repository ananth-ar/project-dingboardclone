import express, { Request, Response } from "express";
import path from "path";
import cors from "cors";

const app = express();
app.use(
  cors({
    origin: "*",
  })
);

app.use(
  "/client/editor",
  express.static(path.join(__dirname, "../client/editor/dist"))
);

app.use(
  "/client/dashboard",
  express.static(path.join(__dirname, "../client/dashboard/dist"))
);

app.use(express.json());

// app.get("/", (req: Request, res: Response) => {
//   res.sendFile(path.join(__dirname, "../client/editor/dist/index.html"));
// });

// app.get("/dashboard", (req: Request, res: Response) => {
//   res.sendFile(path.join(__dirname, "../client/dashboard/dist/index.html"));
// });

app.use("/test", (req: Request, res: Response) => {
  res.json({ message: "Hello, TypeScript with Express!" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
