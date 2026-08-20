import "reflect-metadata";
import "./container";
import express from "express";
import { errorHandler } from "@middlewares/error-handler.middleware";
import { securityMiddlewares } from "@middlewares/security.middleware";
import pinoHttp from "pino-http";
import { logger } from "@config/logger";
import { notFoundHandler } from "@middlewares/not-found.middleware";
import { env } from "@config/env";
import { printStartupBanner } from "@config/startup-banner";
import { mountControllers, listRegisteredRoutes } from "@config/router-factory";
import { runPreDestroyHooks } from "@decorators/lifecycle.decorator";

const app = express();

app.use(...securityMiddlewares);
app.use(express.json({ limit: "10kb" }));
app.use(pinoHttp({ logger }));

mountControllers(app);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(env.PORT, () => {
  printStartupBanner(env.PORT);

  const routes = listRegisteredRoutes();
  logger.info(`Routes registered (${routes.length}):`);
  routes.forEach((r) => {
    logger.info(`  ${r.method.padEnd(6)} ${r.path}`);
  });
});

function shutdown(signal: string) {
  logger.info(`${signal} received. shutting down gracefully...`);
  server.close(async () => {
    await runPreDestroyHooks();
    logger.info("Server closed. Exiting process.");
    process.exit(0);
  });

  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10_000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled Promise Rejection");
});

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught Exception   Process will exit");
  process.exit(1);
});