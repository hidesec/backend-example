import { Bean } from "@decorators/bean.decorator";
import { BaseRepository } from "@database/base.repository";
import { getQueryRunner } from "@database/transaction-context";
import { IUserRepository } from "./user.repository.interface";
import { User } from "@entities/user.entity";

@Bean("IUserRepository")
export class UserRepository extends BaseRepository<User, string> implements IUserRepository {
    protected readonly entityCtor = User;

    async findByEmail(email: string): Promise<User | null> {
        const result = await getQueryRunner().query(
            `SELECT * FROM ${this.qualifiedTable} WHERE email = $1`,
            [email]
        );
        return result.rows[0] ? this.mapRow(result.rows[0]) : null;
    }
}