import { logger } from "@config/logger";
import pinoHttp from "pino-http";

export const requestLogger = pinoHttp({
    logger,
    customLogLevel: (req, res, err) => {
        if (res.statusCode >= 500 || err) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
    },
    customSuccessMessage: (req, res) => {
        return `${req.method} ${req.url} -> ${res.statusCode}`;
    },
    customErrorMessage: (req, res, err) => {
        return `${req.method} ${req.url} -> ${res.statusCode} | ${err.message}`;
    },
    customAttributeKeys: {
        responseTime: "durationMs",
    },
    serializers: {
        req: (req) => ({
            method: req.method,
            url: req.url,
            ip: req.headers["x-forwarded-for"] || req.socket?.remoteAddress,
        }),
        res: (res) => ({
            statusCode: res.statusCode,
        }),
    },
});