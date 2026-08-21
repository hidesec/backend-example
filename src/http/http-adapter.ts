import { SolumHandler } from "./http-types";

export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";

export interface RouteRegistration {
    method: HttpMethod;
    path: string;
    handler: SolumHandler;
}

export interface HttpAdapter {
    registerRoute(prefix: string, route: RouteRegistration): void;
    listen(port: number, callback?: () => void): unknown;
}