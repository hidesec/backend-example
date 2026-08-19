import { inject } from "tsyringe";
import { Request } from "express";
import { UserResponseDto } from "@dto/user-response.dto";
import { IUserService } from "@services/user.service.interface";
import { RestController, Get, Post } from "@decorators/route.decorator";
import { ResponseStatus } from "@decorators/response.decorator";

@RestController("/users")
export class UserController {
    constructor(
        @inject("IUserService") private readonly userService: IUserService
    ) {}

    @Post("/")
    @ResponseStatus(201)
    createUser = async (req: Request) => {
        req.log.info({ body: { email: req.body.email } }, "Creating new user");
        const user = await this.userService.createUser(req.body as any);
        req.log.info({ userId: user.id }, "User created successfully");
        return user;
    }

    @Get("/:id")
    getUserById = async (req: Request) => {
        const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        req.log.info({ param: id }, "Get user by id");

        const user = await this.userService.getUserById(id);

        req.log.info({ param: id }, "Get user successfully");
        return UserResponseDto.fromEntity(user);
    }
}