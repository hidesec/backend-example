import { Application, NextFunction, Request, Response, Router } from "express";
import { container } from "tsyringe";
import { getRegisteredControllers, getRoutesMetadata } from "@decorators/route.decorator";
import { getResponseStatus } from "@decorators/response.decorator";

interface RouteInfo {
    method: string;
    path: string;
}

const registeredRoutes: RouteInfo[] = [];

function joinPaths(prefix: string, path: string): string {
    const full = `${prefix}/${path}`.replace(/\/+/g, "/");
    return full.length > 1 && full.endsWith("/") ? full.slice(0, -1) : full;
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

    const successStatus = getResponseStatus(controllerTarget, handlerName);

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
            next(err);
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