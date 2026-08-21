import { loadEnv } from "./load-env";

loadEnv();

type EnvValue = string | number;

interface FieldSpec {
    required?: boolean;
    default?: EnvValue;
    choices?: string[];
    isPort?: boolean;
    isNumber?: boolean;
}

const SCHEMA: Record<string, FieldSpec> = {
    NODE_ENV: { required: true, choices: ["development", "production", "test"] },
    PORT: { default: 3000, isPort: true },
    JWT_SECRET: { required: true },
    RATE_LIMIT_MAX: { default: 100, isNumber: true },
    DB_HOST: { default: "localhost" },
    DB_PORT: { default: 5432, isPort: true },
    DB_NAME: { required: true },
    DB_USER: { required: true },
    DB_PASSWORD: { required: true },
};

function validate(spec: FieldSpec, key: string, raw: string | undefined): EnvValue {
    if (raw === undefined || raw === "") {
        if (spec.default !== undefined) return spec.default;
        if (spec.required) throw new Error(`Missing required environment variable "${key}"`);
        return "";
    }

    if (spec.choices && !spec.choices.includes(raw)) {
        throw new Error(`Environment variable "${key}" must be one of: ${spec.choices.join(", ")}`);
    }

    if (spec.isPort) {
        const port = Number(raw);
        if (!Number.isInteger(port) || port < 0 || port > 65535) {
            throw new Error(`Environment variable "${key}" must be a valid port number`);
        }
        return port;
    }

    if (spec.isNumber) {
        const num = Number(raw);
        if (!Number.isFinite(num)) {
            throw new Error(`Environment variable "${key}" must be a number`);
        }
        return num;
    }

    return raw;
}

function buildEnv(): Record<string, EnvValue> {
    const errors: string[] = [];
    const result: Record<string, EnvValue> = {};

    for (const [key, spec] of Object.entries(SCHEMA)) {
        try {
            result[key] = validate(spec, key, process.env[key]);
        } catch (err) {
            errors.push((err as Error).message);
        }
    }

    if (errors.length > 0) {
        throw new Error(`Invalid environment configuration:\n${errors.map((e) => ` - ${e}`).join("\n")}`);
    }

    return result;
}

export const env = buildEnv() as {
    NODE_ENV: "development" | "production" | "test";
    PORT: number;
    JWT_SECRET: string;
    RATE_LIMIT_MAX: number;
    DB_HOST: string;
    DB_PORT: number;
    DB_NAME: string;
    DB_USER: string;
    DB_PASSWORD: string;
};
