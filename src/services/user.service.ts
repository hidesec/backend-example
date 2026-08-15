import { inject, injectable } from "tsyringe";
import { IUserService } from "./user.service.interface";
import { IUserRepository } from "repositories/user.repository.interface";
import { User } from "entities/user.entity";
import { CreateUserDto } from "dto/create-user.dto";
import { NotFoundException } from "exceptions/http-exceptions";

@injectable()
export class UserService implements IUserService {
    constructor(
        @inject("IUserRepository") private readonly userRepository: IUserRepository
    ) {}

    async createUser(dto: CreateUserDto): Promise<User> {
        const id = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        const user = new User(id, dto.name, dto.email);
        return this.userRepository.save(user);
    }

    async getUserById(id: string): Promise<User | null> {
        const user = this.userRepository.findById(id);
        if (!user) {
            throw new NotFoundException(`User with id ${id} not found`);
        }
        return user;
    }
}