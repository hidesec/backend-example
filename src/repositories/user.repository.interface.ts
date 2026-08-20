import { User } from "@entities/user.entity";
import { IBaseRepository } from "@database/base-repository.interface";

export interface IUserRepository extends IBaseRepository<User, string> {
    findByEmail(email: string): Promise<User | null>;
}