import "@lang/reflect-metadata";
import "./container";
import { container } from "@di/container";
import { NodeHttpAdapter } from "@http/adapters/node.adapter";
import { errorHandler } from "@middlewares/error-handler.middleware";
import { securityMiddlewares } from "@middlewares/security.middleware";
import { requestLogger } from "@middlewares/request-logger.middleware";
import { notFoundHandler } from "@middlewares/not-found.middleware";
import { env } from "@config/env";
import { logger } from "@config/logger";
import { printStartupBanner } from "@config/startup-banner";
import { mountControllers, listRegisteredRoutes } from "@config/router-factory";
import { runPreDestroyHooks } from "@decorators/lifecycle.decorator";
import { startScheduledTasks, stopScheduledTasks } from "@schedule/scheduler";
import { createDatabaseDriver } from "@database/driver.factory";
import { registerDatabaseDriver } from "@database/transaction-context";
import { cacheManager, hasRedisConfigured } from "@decorators/cache.decorator";
import { connectRedis, isRedisEnabled, RedisCacheStore } from "@database/nosql/redis.connection";
import { connectMongo } from "@database/nosql/mongo.connection";

const httpAdapter = new NodeHttpAdapter({
  bodyLimitBytes: 10 * 1024,
  notFoundHandler,
  errorHandler,
});

httpAdapter.use(...securityMiddlewares);
httpAdapter.use(requestLogger());

async function bootstrap() {
  const driver = await createDatabaseDriver();
  registerDatabaseDriver(driver);

  if (isRedisEnabled()) {
    const redis = await connectRedis(env.REDIS_URL);
    cacheManager.useStore(new RedisCacheStore(redis));
    logger.info("Redis cache backend enabled");
  } else if (hasRedisConfigured()) {
    logger.warn("REDIS_URL configured but empty, using in-memory cache");
  }

  if (env.MONGO_URL) {
    const mongoDb = await connectMongo(env.MONGO_URL);
    container.register("MongoDb", { useValue: mongoDb });
    logger.info(`Connected to MongoDB database "${mongoDb.databaseName}"`);
  }

  mountControllers(httpAdapter);

  const server = httpAdapter.listen(env.PORT, () => {
    printStartupBanner(env.PORT);

    const routes = listRegisteredRoutes();
    logger.info(`Routes registered (${routes.length}):`);
    routes.forEach((r) => {
      logger.info(`  ${r.method.padEnd(6)} ${r.path}`);
    });

    startScheduledTasks();
  }) as import("http").Server;

  return { server, driver };
}

bootstrap()
  .then(({ server, driver }) => {
    function shutdown(signal: string) {
      logger.info(`${signal} received. shutting down gracefully...`);
      stopScheduledTasks();
      server.close(async () => {
        await driver.close();
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
  });

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled Promise Rejection");
});

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught Exception   Process will exit");
  process.exit(1);
});
