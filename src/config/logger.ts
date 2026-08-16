import pino from "pino";
import { env } from "./env";

export const logger = pino({
    level: env.NODE_ENV === "production" ? "info" : "debug",
    base: {
        env: env.NODE_ENV,
        pid: process.pid,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    transport: env.NODE_ENV === "production" ? { target: "pino-roll", options: { file: "./logs/app", frequency: "daily", mkdir: true } } : { target: "pino-pretty", options: { colorize: true, translateTime: "yyyy-mm-dd HH:MM:ss", ignore: "pid,hostname,env", messageFormat: "{msg}" } },
});