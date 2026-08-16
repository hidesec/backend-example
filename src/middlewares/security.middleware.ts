import { env } from "config/env";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";

export const securityMiddlewares = [
    helmet(),
    cors({
        origin: env.NODE_ENV === "production" ? "https://myproductiondomain.com" : "*",
        credentials: true,
    }),
    rateLimit({
        windowMs: 15 * 60 * 1000,
        max: env.RATE_LIMIT_MAX,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
            status: "error",
            message: "Too many requests, please try again later.",
        }
    })
]
