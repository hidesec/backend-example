import { UserRepository } from "repositories/user.repository";
import { IUserRepository } from "repositories/user.repository.interface";
import { UserService } from "services/user.service";
import { IUserService } from "services/user.service.interface";
import { container } from "tsyringe";

container.register<IUserRepository>("IUserRepository", { useClass: UserRepository });
container.register<IUserService>("IUserService", { useClass: UserService });