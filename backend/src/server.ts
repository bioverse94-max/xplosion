import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { APP_CONFIG } from "./lib/config";

// Route Imports
import eventsRouter from "./routes/events.routes";
import checkoutRouter from "./routes/checkout.routes";
import passesRouter from "./routes/passes.routes";
import adminRouter from "./routes/admin.routes";
import checkinRouter from "./routes/checkin.routes";
import authRouter from "./routes/auth.routes";

dotenv.config();

const app = express();

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check for Render Deployment
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    service: "Neon Genesis 2026 Ticketing Backend",
    timestamp: new Date().toISOString(),
    database: "Supabase PostgreSQL",
  });
});

app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Neon Genesis 2026 API Server is operational.",
    docs: "/health",
  });
});

// Mount Routes
app.use("/api/events", eventsRouter);
app.use("/api/checkout", checkoutRouter);
app.use("/api/passes", passesRouter);
app.use("/api/admin/checkin", checkinRouter);
app.use("/api/admin/auth", authRouter);
app.use("/api/admin", adminRouter);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: "Endpoint not found." });
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("[ServerError]:", err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === "production" ? "Internal server error." : err.message,
  });
});

// Start Server
const PORT = APP_CONFIG.port || 5000;
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Neon Genesis 2026 Backend Running on Port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
  console.log(`🐘 Database: Supabase PostgreSQL`);
  console.log(`=======================================================`);
});
