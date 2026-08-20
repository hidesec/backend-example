import { IUserRepository } from "@repositories/user.repository.interface";
import { IUserService } from "./user.service.interface";
import { CreateUserDto } from "@dto/create-user.dto";
import { User } from "@entities/user.entity";
import { BadRequestException, NotFoundException } from "@exceptions/http-exceptions";
import { Bean } from "@decorators/bean.decorator";
import { inject } from "tsyringe";
import { randomUUID } from "crypto";
import { Transactional } from "@decorators/transactional.decorator";
import { Auditable } from "@decorators/auditable.decorator";
import { LogExecution } from "@decorators/log-execution.decorator";
import { PostConstruct } from "@decorators/lifecycle.decorator";
import { logger } from "@config/logger";

@Bean("IUserService")
export class UserService implements IUserService {
    constructor( 
        @inject("IUserRepository") 
        private readonly userRepository: IUserRepository
    ) {}

    @PostConstruct()
    init() {
        logger.info("[@PostConstruct] UserService initialized")
    }

    @Transactional()
    @Auditable("USER_CREATED")
    @LogExecution()
    async createUser(dto: CreateUserDto): Promise<User> {
        const id = randomUUID();
        const existing = await this.userRepository.findByEmail(dto.email);
        if(existing) {
            throw new BadRequestException(`Email ${dto.email} is already registered`);
        }
        
        const user = new User(id, dto.name, dto.email);
        return this.userRepository.save(user);
    }

    @Auditable("GET_USER")
    @LogExecution()
    async getUserById(id: string): Promise<User> {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new NotFoundException(`User with id ${id} not found`);
        }
        return user;
    }
}