import { HttpException } from "exceptions/http-exceptions";
import { Request, Response, NextFunction } from "express";

export function errorHandler(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    if ( err instanceof HttpException) {
        res.status(err.statusCode).json({
            status: "error",
            message: err.message,
        })
        return;
    }

    console.error(err);
    res.status(500).json({
        status: "error",
        message: "Internal Server Error",
    })
}