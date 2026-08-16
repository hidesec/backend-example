import { User } from "@entities/user.entity";

export interface IUserRepository {
    findById(id: string): Promise<User | null>;
    findAll(): Promise<User[]>;
    save(user: User): Promise<User>;
}