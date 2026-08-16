import dotenv from 'dotenv';
import { cleanEnv, num, port, str } from 'envalid';

dotenv.config();

export const env = cleanEnv(process.env, {
    NODE_ENV: str({
        choices: ['development', 'production', 'test'],
    }),
    PORT: port({ default: 3000 }),
    JWT_SECRET: str(),
    RATE_LIMIT_MAX: num({ default: 100 }),

    DB_HOST: str({ default: "localhost" }),
    DB_PORT: port({ default:  5432 }),
    DB_NAME: str(),
    DB_USER: str(),
    DB_PASSWORD: str(),
})