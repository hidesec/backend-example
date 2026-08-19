import { getRegisteredControllers, getRoutesMetadata } from "@decorators/route.decorator";
import { Application, Router } from "express";
import { container } from "tsyringe";

interface RouteInfo {
    method: string;
    path: string;
}

const registeredRoutes: RouteInfo[] = [];

function joinPaths(prefix: string, path: string): string {
    const full = `${prefix}/${path}`.replace(/\/+/g, "/");
    return full.length > 1 && full.endsWith("/") ? full.slice(0, -1) : full;
}

export function mountControllers(app: Application): void {
    getRegisteredControllers().forEach(({ target, prefix}) => {
        const routes = getRoutesMetadata(target);

        if (routes.length === 0) {
            console.warn(`[@RestController] "${target.name}" has no route handlers defined.`);
            return;
        }

        const instance = container.resolve(target);
        const router = Router();

        routes.forEach(({ method, path, handlerName }) => {
            const handler = (instance as any)[handlerName];
            if (typeof handler !== "function") {
                throw new Error(`Handler "${handlerName}" not found on controller "${target.name}"`);
            }

            router[method](path, handler.bind(instance));
            registeredRoutes.push({ method: method.toUpperCase(), path: joinPaths(prefix, path) });

            app.use(prefix, router);
        });
    });
}

export function listRegisteredRoutes(): RouteInfo[] {
    return registeredRoutes;
}