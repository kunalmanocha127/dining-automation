import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import express, { ErrorRequestHandler } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { connectDB } from "./config/db";
import { menuRouter } from "./routes/menuRoutes";
import { orderRouter } from "./routes/orderRoutes";

const app = express();
const httpServer = createServer(app);
const port = Number(process.env.PORT ?? 5000);
const clientOrigin = process.env.CLIENT_ORIGIN ?? "http://localhost:5173";

const io = new Server(httpServer, {
  cors: {
    origin: clientOrigin,
    credentials: true
  }
});

app.set("io", io);

app.use(
  cors({
    origin: clientOrigin,
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/menu", menuRouter);
app.use("/api/orders", orderRouter);

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error(error);

  res.status(500).json({
    message: "Internal server error."
  });
};

app.use(errorHandler);

const startServer = async (): Promise<void> => {
  await connectDB();

  httpServer.listen(port, () => {
    console.log(`Backend API listening on port ${port}`);
  });
};

startServer().catch((error) => {
  console.error("Failed to start backend server", error);
  process.exit(1);
});
