
import { User } from "@entities/user.entity";
import { IUserRepository } from "./user.repository.interface";
import { Bean } from "@decorators/bean.decorator";

@Bean("IUserRepository")
export class UserRepository implements IUserRepository {
    private db: Map<string, User> = new Map();

    async findById(id: string): Promise<User | null> {
        return this.db.get(id) ?? null;
    }

    async findAll(): Promise<User[]> {
        return Array.from(this.db.values());
    }

    async save(user: User): Promise<User> {
        this.db.set(user.id.toString(), user);
        return user;
    }
}