import express from "express";
import { pool } from "./db/pool.js";
import { errorHandler } from "./middleware/errorHandler.js";
import authRouter from "./routes/authRoutes.js";
import serviceRouter from "./routes/serviceRoutes.js";
import { env } from "./env.js";

const app = express();
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/services", serviceRouter);

app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  console.log(`Sentinel listening on :${env.PORT} (${env.NODE_ENV})`);
});

// Graceful shutdown — don't drop in-flight DB writes
async function shutdown(signal: string): Promise<void> {
  console.log(`${signal} received, shutting down...`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));