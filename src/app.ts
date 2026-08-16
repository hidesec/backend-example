import "reflect-metadata";
import "./container"; 
import express from "express";
import userRoutes from "./routes/user.route";
import { errorHandler } from "middlewares/error-handler.middleware";
import { securityMiddlewares} from "middlewares/security.middleware";
import pinoHttp from "pino-http";
import { logger } from "config/logger";
import healthRoutes from "./routes/health.route";
import { notFoundHandler } from "middlewares/not-found.middleware";
import { env } from "config/env";

const app = express();

app.use(...securityMiddlewares);
app.use(express.json({ limit: "10kb" }));
app.use(pinoHttp({ logger }));

app.use("/", healthRoutes);
app.use("/users", userRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const server = app.listen(env.PORT, () => {
    logger.info(`Server is running on port ${env.PORT}`);
})

function shutdown(signal: string) {
    logger.info(`${signal} received. shutting down gracefully...`);
    server.close(() => {
        logger.info("Server closed. Exiting process.");
        process.exit(0);
    });

    setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
    }, 10_0000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));