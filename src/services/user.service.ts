import { IUserRepository } from "@repositories/user.repository.interface";
import { IUserService } from "./user.service.interface";
import { CreateUserDto } from "@dto/create-user.dto";
import { User } from "@entities/user.entity";
import { BadRequestException, NotFoundException } from "@exceptions/http-exceptions";
import { Bean } from "@decorators/bean.decorator";
import { inject } from "tsyringe";

@Bean("IUserService")
export class UserService implements IUserService {
    constructor( 
        @inject("IUserRepository") 
        private readonly userRepository: IUserRepository
    ) {}

    async createUser(dto: CreateUserDto): Promise<User> {
        const id = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
        const existing = await this.userRepository.findByEmail(dto.email);
        if(existing) {
            throw new BadRequestException(`Email ${dto.email} is already registered`);
        }
        
        const user = new User(id.toString(), dto.name, dto.email);
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