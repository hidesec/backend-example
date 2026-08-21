import { SolumRequest, SolumResponse } from "@http/http-types";

export function notFoundHandler(req: SolumRequest, res: SolumResponse): void {
    res.status(404).json({
        status: "error",
        message: `Route ${req.method} ${req.path} not found`,
    });
}