import express, { Request, Response } from "express";
import cors from "cors";
import { prisma } from "@repo/database";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/", async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { username: "ananth.ar" },
  });

  console.log(user);
  res.json(user);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
