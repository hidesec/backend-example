import { Application, Router } from "express";

interface RouteInfo {
  method: string;
  path: string;
}

const registeredRoutes: RouteInfo[] = [];

export function mountRoutes(app: Application, prefix: string, router: Router): void {
  app.use(prefix, router);

  const stack = (router as any).stack ?? [];
  stack.forEach((layer: any) => {
    if (layer.route) {
      const suffix = layer.route.path === "/" ? "" : layer.route.path;
      const fullPath = (prefix === "/" ? "" : prefix) + suffix || "/";
      const methods = Object.keys(layer.route.methods);
      methods.forEach((m) => registeredRoutes.push({ method: m.toUpperCase(), path: fullPath }));
    }
  });
}

export function listRegisteredRoutes(): RouteInfo[] {
  return registeredRoutes;
}