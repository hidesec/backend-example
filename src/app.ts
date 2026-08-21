import "reflect-metadata";
import "./container";
import express from "express";
import { ExpressHttpAdapter, toExpressErrorHandler, toExpressNotFoundHandler } from "@http/adapters/express.adapter";
import { errorHandler } from "@middlewares/error-handler.middleware";
import { securityMiddlewares } from "@middlewares/security.middleware";
import pinoHttp from "pino-http";
import { logger } from "@config/logger";
import { notFoundHandler } from "@middlewares/not-found.middleware";
import { env } from "@config/env";
import { printStartupBanner } from "@config/startup-banner";
import { mountControllers, listRegisteredRoutes } from "@config/router-factory";
import { runPreDestroyHooks } from "@decorators/lifecycle.decorator";

const rawApp = express();

rawApp.use(...securityMiddlewares);
rawApp.use(express.json({ limit: "10kb" }));
rawApp.use(pinoHttp({ logger }));

const httpAdapter = new ExpressHttpAdapter(rawApp);

mountControllers(httpAdapter);

rawApp.use(toExpressNotFoundHandler(notFoundHandler));
rawApp.use(toExpressErrorHandler(errorHandler));

const server = httpAdapter.listen(env.PORT, () => {
  printStartupBanner(env.PORT);

  const routes = listRegisteredRoutes();
  logger.info(`Routes registered (${routes.length}):`);
  routes.forEach((r) => {
    logger.info(`  ${r.method.padEnd(6)} ${r.path}`);
  });
}) as import("http").Server;

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