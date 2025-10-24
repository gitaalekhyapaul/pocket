import express, { type Request, type Response } from "express";
import { config } from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import familyRoutes from "./routes/family.js";
import spendRoutes from "./routes/spend.js";
import { blockchainService } from "./services/blockchain.js";

config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Routes
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Pocket Family Payments API",
    version: "1.0.0",
    status: "running",
  });
});

app.get("/api/v1/health", (req: Request, res: Response) => {
  res.status(200).json({
    message: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API routes
app.use("/api/v1/families", familyRoutes);
app.use("/api/v1/spend", spendRoutes);

// Socket.IO for real-time updates
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join-family", (familyId) => {
    socket.join(`family-${familyId}`);
    console.log(`Client ${socket.id} joined family ${familyId}`);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// Make io available to other modules
app.set("io", io);

// Start blockchain event listener
blockchainService.listenToEvents();

// Start server
const PORT = process.env.PORT || 4000;

Promise.all([])
  .then(([]) => {
    server.listen(PORT, () => {
      console.log(`🚀 Pocket Family Payments API running on port ${PORT}`);
      console.log(`📡 WebSocket server ready for real-time updates`);
      console.log(`🔗 Blockchain event listener started`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });

// Process termination handlers
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  blockchainService.stopListening();
  process.exit(1);
});

process.on("SIGINT", () => {
  console.log("Server is shutting down...");
  blockchainService.stopListening();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("Server is shutting down...");
  blockchainService.stopListening();
  process.exit(0);
});

process.on("unhandledRejection", (error) => {
  console.error("Unhandled Rejection:", error);
  blockchainService.stopListening();
  process.exit(1);
});

process.on("SIGHUP", () => {
  console.log("Server is shutting down...");
  blockchainService.stopListening();
  process.exit(0);
});
