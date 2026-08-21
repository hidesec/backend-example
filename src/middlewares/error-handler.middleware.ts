import { getFrameworkLogger } from "@core/framework-logger";
import { HttpException } from "@exceptions/http-exceptions";
import { SolumRequest, SolumResponse } from "@http/http-types";

export function errorHandler(err: Error, req: SolumRequest, res: SolumResponse): void {
    if (err instanceof HttpException) {
        getFrameworkLogger().warn({ path: req.path, statusCode: err.statusCode }, err.message);
        res.status(err.statusCode).json({
            status: "error",
            message: err.message,
        });
        return;
    }

    getFrameworkLogger().error({ err, path: req.path }, "Unhandled exception");
    res.status(500).json({
        status: "error",
        message: "Internal Server Error",
    });
}