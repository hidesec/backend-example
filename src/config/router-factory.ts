import { Application, NextFunction, Request, Response, Router } from "express";
import { container } from "tsyringe";
import { getRegisteredControllers, getRoutesMetadata } from "@decorators/route.decorator";
import { getResponseStatus } from "@decorators/response.decorator";
import {
    findMostSpecificHandler,
    getExceptionHandlers,
    getRegisteredAdvice,
} from "@decorators/exception-handler.decorator";

interface RouteInfo {
    method: string;
    path: string;
}

const registeredRoutes: RouteInfo[] = [];

function joinPaths(prefix: string, path: string): string {
    const full = `${prefix}/${path}`.replace(/\/+/g, "/");
    return full.length > 1 && full.endsWith("/") ? full.slice(0, -1) : full;
}

async function tryHandleWithExceptionHandlers(
    err: Error,
    handlerTarget: Function,
    handlerInstance: any,
    req: Request,
    res: Response
): Promise<boolean> {
    const handlers = getExceptionHandlers(handlerTarget);
    if (handlers.length === 0) return false;

    const match = findMostSpecificHandler(err, handlers);
    if (!match) return false;

    const method = handlerInstance[match.handlerName];
    const result = await method.call(handlerInstance, err, req, res);
    if (res.headersSent) return true;

    const statusFromException = (err as any).statusCode;
    const status = getResponseStatus(handlerTarget, match.handlerName, statusFromException ?? 500);
    
    res.status(status).json(result ?? { status: "error", message: err.message });
    return true;
}

function wrapHandler(
    instance: any,
    handlerName: string,
    controllerTarget: Function
) {
    const handler = instance[handlerName];
    if (typeof handler !== "function") {
        throw new Error(`Handler "${handlerName}" not found on controller "${controllerTarget.name}"`);
    }

    const successStatus = getResponseStatus(controllerTarget, handlerName, 200);

    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const result = await handler.call(instance, req, res, next);

            if (res.headersSent) {
                return;
            }

            if (result === undefined) {
                res.status(successStatus).end();
                return;
            }

            res.status(successStatus).json(result);
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            if (await tryHandleWithExceptionHandlers(error, controllerTarget, instance, req, res)) {
                return;
            }

            for (const adviceTarget of getRegisteredAdvice()) {
                const adviceInstance = container.resolve(adviceTarget);
                if (await tryHandleWithExceptionHandlers(error, adviceTarget, adviceInstance, req, res)) {
                    return;
                }
            }

            next(error);
        }
    };
}
export function mountControllers(app: Application): void {
    getRegisteredControllers().forEach(({ target, prefix }) => {
        const routes = getRoutesMetadata(target);

        if (routes.length === 0) {
            console.warn(`[@RestController] "${target.name}" has no route handlers defined.`);
            return;
        }

        const instance = container.resolve(target);
        const router = Router();

        routes.forEach(({ method, path, handlerName }) => {
            router[method](path, wrapHandler(instance, handlerName, target));
            registeredRoutes.push({ method: method.toUpperCase(), path: joinPaths(prefix, path) });
        });

        app.use(prefix, router);
    });
}

export function listRegisteredRoutes(): RouteInfo[] {
    return registeredRoutes;
}