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
import { auditMetaMiddleware } from "./shared/middleware/auditMeta";
import { startAuditWorker } from "./workers/auditWorker";
import { startAiWorker } from "./workers/aiWorker";

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
    const { db, pool } = createDb();
    const { mongoDb } = await createMongo();
    const redis = createRedis();
    const rmq = await createRabbitMQ();

    app.use(auditMetaMiddleware);

    setupRoutes(app, { db, pool, redis, mongoDb, rmq });

    startAuditWorker(rmq, mongoDb).catch((err: unknown) => {
      logger.error({ err }, "Audit worker failed");
    });
    startAiWorker(rmq, pool, redis).catch((err: unknown) => {
      logger.error({ err }, "AI worker failed");
    });
    logger.info("Workers started");

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
