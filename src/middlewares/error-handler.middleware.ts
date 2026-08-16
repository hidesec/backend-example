import { logger } from "config/logger";
import { HttpException } from "exceptions/http-exceptions";
import { Request, Response, NextFunction } from "express";

export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
): void {
    if ( err instanceof HttpException) {
        logger.warn({ path: req.path, statusCode: err.statusCode }, err.message);
        res.status(err.statusCode).json({
            status: "error",
            message: err.message,
        });
        return;
    }

    logger.error({ err, path: req.path }, "Unhandled exception");
    res.status(500).json({
        status: "error",
        message: "Internal Server Error",
    })
}