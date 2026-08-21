import { AsyncLocalStorage } from "async_hooks";
import { Pool, PoolClient } from "pg";
import { container } from "@di/container";

type Queryable = Pick<Pool | PoolClient, "query">;

const transactionStorage = new AsyncLocalStorage<PoolClient>();

export function getQueryRunner(): Queryable {
    const activeClient = transactionStorage.getStore();
    if (activeClient) {
        return activeClient;
    }
    return container.resolve<Pool>("DatabasePool");
}

export function getActiveTransactionClient(): PoolClient | undefined {
    return transactionStorage.getStore();
}

export function runInTransactionContext<T>(client: PoolClient, fn: () => Promise<T>): Promise<T> {
    return transactionStorage.run(client, fn);
}