import express, { type Request, type Response } from "express";
import { config } from "dotenv";
import cors from "cors";

config();

const app = express();

app.use(express.json());
app.use(cors());

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World");
});

app.use("/api/v1/health", (req: Request, res: Response) => {
  res.status(200).json({
    message: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

Promise.all([])
  .then(([]) => {
    app.listen(process.env.PORT || 3000, () => {
      console.log(`Server is running on port ${process.env.PORT || 3000}`);
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

// Process termination handlers
process.on("uncaughtException", (error) => {
  console.error(error);
  process.exit(1);
});
process.on("SIGINT", () => {
  console.log("Server is shutting down...");
  process.exit(0);
});
process.on("SIGTERM", () => {
  console.log("Server is shutting down...");
  process.exit(0);
});
process.on("unhandledRejection", (error) => {
  console.error(error);
  process.exit(1);
});
process.on("SIGHUP", () => {
  console.log("Server is shutting down...");
  process.exit(0);
});
