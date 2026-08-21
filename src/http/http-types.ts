export interface SolumLogger {
    info(obj: object, msg?: string): void;
    warn(obj: object, msg?: string): void;
    error(obj: object, msg?: string): void;
}

export interface SolumRequest {
    method: string;
    path: string;
    params: Record<string, string>;
    query: Record<string, unknown>;
    headers:Record<string, string | string[] | undefined>;
    body: any;
    log: SolumLogger;
    raw: unknown;
}

export interface SolumResponse {
    status(code: number): this;
    json(body: unknown): void;
    end(): void;
    readonly headersSent: boolean;
    raw: unknown;
}

export type SolumNext = (err?: unknown) => void;

export type SolumHandler = (req: SolumRequest, res: SolumResponse, next: SolumNext) => unknown;