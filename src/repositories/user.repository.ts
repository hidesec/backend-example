import { Pool } from "pg";
import { inject } from "tsyringe";
import { Bean } from "@decorators/bean.decorator";
import { IUserRepository } from "./user.repository.interface";
import { User } from "../entities/user.entity";

interface UserRow {
    id: string;
    name: string;
    email: string;
    created_at: Date;
}

function mapRowToUser(row: UserRow): User {
    return new User(row.id, row.name, row.email, row.created_at);
}

@Bean("IUserRepository")
export class UserRepository implements IUserRepository {
    constructor(@inject("DatabasePool") private readonly pool: Pool) {}

    async findById(id: string): Promise<User | null> {
        const result = await this.pool.query<UserRow>(
        "SELECT id, name, email, created_at FROM users WHERE id = $1",
        [id]
        );
        return result.rows[0] ? mapRowToUser(result.rows[0]) : null;
    }

    async findByEmail(email: string): Promise<User | null> {
        const result = await this.pool.query<UserRow>(
        "SELECT id, name, email, created_at FROM users WHERE email = $1",
        [email]
        );
        return result.rows[0] ? mapRowToUser(result.rows[0]) : null;
    }

    async findAll(): Promise<User[]> {
        const result = await this.pool.query<UserRow>(
        "SELECT id, name, email, created_at FROM users ORDER BY created_at DESC"
        );
        return result.rows.map(mapRowToUser);
    }

    async save(user: User): Promise<User> {
        const result = await this.pool.query<UserRow>(
        `INSERT INTO users (id, name, email, created_at)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id) DO UPDATE
            SET name = EXCLUDED.name, email = EXCLUDED.email
        RETURNING id, name, email, created_at`,
        [user.id, user.name, user.email, user.createdAt]
        );
        return mapRowToUser(result.rows[0]);
    }

    async deleteById(id: string): Promise<void> {
        await this.pool.query("DELETE FROM users WHERE id = $1", [id]);
    }
}