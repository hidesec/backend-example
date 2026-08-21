import express, { Application, NextFunction, Request, Response, Router } from "express";
import { HttpAdapter, RouteRegistration } from "../http-adapter";
import { SolumLogger, SolumRequest, SolumResponse } from "../http-types";

const consoleFallbackLogger: SolumLogger = {
    info: (obj, msg) => console.log(msg ?? "", obj),
    warn: (obj, msg) => console.warn(msg ?? "", obj),
    error: (obj, msg) => console.error(msg ?? "", obj),
}

function toSolumRequest(req: Request): SolumRequest {
    return {
        method: req.method,
        path: req.path,
        params: req.params as Record<string, string>,
        query: req.query as Record<string, unknown>,
        headers: req.headers,
        body: req.body,
        log: (req as any).log ?? consoleFallbackLogger,
        raw: req,
    }
}

function toSolumResponse(res: Response): SolumResponse {
    const wrapper: SolumResponse = {
        status(code: number) {
            res.status(code);
            return wrapper;
        },
        json(body: unknown) {
            res.json(body);
        },
        end() {
            res.end();
        },
        get headersSent() {
            return res.headersSent;
        },
        raw: res,
    };
    return wrapper;
}

export class ExpressHttpAdapter implements HttpAdapter {
    private readonly routersByPrefix = new Map<string, Router>();

    constructor(private readonly app: Application) {}

    registerRoute(prefix: string, route: RouteRegistration): void {
        let router = this.routersByPrefix.get(prefix);
        if(!router) {
            router = Router();
            this.routersByPrefix.set(prefix, router);
            this.app.use(prefix, router);
        }

        router[route.method](route.path, (req: Request, res: Response, next: NextFunction) => {
            const result = route.handler(toSolumRequest(req), toSolumResponse(res), next);
            if (result && typeof (result as Promise<unknown>).catch === "function") {
                (result as Promise<unknown>).catch(next);
            }
        });
    }

    listen(port: number, callback?: () => void): unknown {
        return this.app.listen(port, callback);
    }

    getUnderlyingApp(): Application {
        return this.app;
    }
}

export function toExpressNotFoundHandler(
    handler: (req: SolumRequest, res: SolumResponse) => void
) {
    return (req: Request, res: Response) => handler(toSolumRequest(req), toSolumResponse(res));
}

export function toExpressErrorHandler(
    handler: (err: Error, req: SolumRequest, res: SolumResponse) => void
) {
    return (err: Error, req: Request, res: Response, _next: NextFunction) => handler(err, toSolumRequest(req), toSolumResponse(res));
}

export function createExpressApp(): Application {
    return express();
}