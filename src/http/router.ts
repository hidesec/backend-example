import { SolumHandler, SolumRequest, SolumResponse } from "./http-types";

export interface CompiledRoute {
    method: string;
    path: string;
    pattern: RegExp;
    paramNames: string[];
    handler: SolumHandler;
}

export interface RouteMatch {
    handler: SolumHandler;
    params: Record<string, string>;
}

function compilePath(prefix: string, path: string): { pattern: RegExp; paramNames: string[] } {
    const full = `${prefix}/${path}`.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
    const paramNames: string[] = [];

    const source = full
        .split("/")
        .map((segment) => {
            if (segment.startsWith(":")) {
                paramNames.push(segment.slice(1));
                return "([^/]+)";
            }
            return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        })
        .join("/");

    return { pattern: new RegExp(`^${source}/?$`), paramNames };
}

export class Router {
    private readonly routes: CompiledRoute[] = [];

    add(method: string, prefix: string, path: string, handler: SolumHandler): void {
        const { pattern, paramNames } = compilePath(prefix, path);
        this.routes.push({ method: method.toUpperCase(), path, pattern, paramNames, handler });
    }

    match(method: string, pathname: string): RouteMatch | null {
        for (const route of this.routes) {
            if (route.method !== method.toUpperCase()) continue;

            const found = route.pattern.exec(pathname);
            if (!found) continue;

            const params: Record<string, string> = {};
            route.paramNames.forEach((name, i) => {
                try {
                    params[name] = decodeURIComponent(found[i + 1]);
                } catch {
                    params[name] = found[i + 1];
                }
            });

            return { handler: route.handler, params };
        }

        return null;
    }

    list(): { method: string; path: string }[] {
        return this.routes.map((r) => ({ method: r.method, path: r.path }));
    }
}
