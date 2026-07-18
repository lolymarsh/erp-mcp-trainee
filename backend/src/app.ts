import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import {
  createDb,
  createMongo,
  createRedis,
  createRabbitMQ,
  logger,
} from "./config";
import { setupRoutes } from "./router";

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(helmet());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    code: 200,
    message: "healthy",
    timestamp: new Date().toISOString(),
  });
});

async function start(): Promise<void> {
  try {
    const { db } = createDb();
    const { mongoDb } = await createMongo();
    const redis = createRedis();
    const rmq = await createRabbitMQ();

    setupRoutes(app, { db, redis, mongoDb, rmq });

    app.listen(PORT, () => {
      logger.info(`Server running on :${PORT}`);
    });
  } catch (err) {
    logger.error({ err }, "Failed to start server");
    process.exit(1);
  }
}

start();

export default app;
