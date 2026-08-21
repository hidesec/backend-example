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
import { Cacheable, CacheEvict } from "@decorators/cache.decorator";
import { PostConstruct } from "@decorators/lifecycle.decorator";
import { Page, PageRequest } from "@http/pagination";
import { IEventBus } from "@events/event-bus";
import { hashPassword } from "@auth/crypto.util";
import { UserRole } from "@auth/roles";
import { logger } from "@config/logger";

@Bean("IUserService")
export class UserService implements IUserService {
    constructor(
        @inject("IUserRepository")
        private readonly userRepository: IUserRepository,
        @inject("IEventBus")
        private readonly eventBus: IEventBus
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
        if (dto.password) {
            user.passwordHash = hashPassword(dto.password);
        }

        const saved = await this.userRepository.save(user);
        await this.eventBus.publish("USER_CREATED", { userId: saved.id, email: saved.email });
        return saved;
    }

    @Auditable("GET_USER")
    @LogExecution()
    @Cacheable("users", 30)
    async getUserById(id: string): Promise<User> {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new NotFoundException(`User with id ${id} not found`);
        }
        return user;
    }

    @LogExecution()
    async findRecentByEmails(emails: string[], limit: number): Promise<User[]> {
        if (emails.length === 0) {
            throw new BadRequestException("emails must not be empty");
        }
        return this.userRepository.findRecentByEmails(emails, limit);
    }

    @LogExecution()
    async findPage(request: PageRequest): Promise<Page<User>> {
        return this.userRepository.findPage(request);
    }

    @Transactional()
    @Auditable("USER_DELETED")
    @LogExecution()
    @CacheEvict("users")
    async deleteUser(id: string): Promise<void> {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new NotFoundException(`User with id ${id} not found`);
        }
        await this.userRepository.deleteById(id);
    }

    @Transactional()
    @Auditable("USER_ROLE_UPDATED")
    @LogExecution()
    @CacheEvict("users")
    async updateRole(id: string, role: UserRole): Promise<User> {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new NotFoundException(`User with id ${id} not found`);
        }
        user.role = role;
        return this.userRepository.save(user);
    }
}
