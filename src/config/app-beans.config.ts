import { Bean, Configuration } from "@decorators/bean.decorator";
import { UserRepository } from "@repositories/user.repository";
import { IUserRepository } from "@repositories/user.repository.interface";
import { UserService } from "@services/user.service";
import { IUserService } from "@services/user.service.interface";

@Configuration()
export class AppBeansConfig {
    @Bean("IUserRepository")
    userRepository(): IUserRepository {
        return new UserRepository();
    }

    @Bean("IUserService")
    userService(): IUserService {
        const repository = new UserRepository();
        return new UserService(repository);
    }
}