import { SolumRequest } from "@http/http-types";
import { UserResponseDto } from "@dto/user-response.dto";
import { CreateUserDto } from "@dto/create-user.dto";
import { IUserService } from "@services/user.service.interface";
import { RestController, Get, Post } from "@decorators/route.decorator";
import { ResponseStatus } from "@decorators/response.decorator";
import { AutoWired } from "@decorators/autowired.decorator";
import { ExceptionHandler } from "@decorators/exception-handler.decorator";
import { Body, Param, Query, Req, Valid } from "@decorators/param.decorator";
import { BadRequestException, InvalidQueryParameterException } from "@exceptions/http-exceptions";

@RestController("/users")
export class UserController {
    @AutoWired("IUserService")
    declare private userService: IUserService;

    @Post("/")
    @ResponseStatus(201)
    async createUser(@Valid() @Body() dto: CreateUserDto, @Req() req: SolumRequest) {
        req.log.info({ body: { email: dto.email } }, "Creating new user");
        const user = await this.userService.createUser(dto);
        req.log.info({ userId: user.id }, "User created successfully");
        return user;
    }

    @Get("/recent")
    @ResponseStatus(200)
    async findRecentByEmails(
        @Query("emails") emails: string,
        @Query("limit") limit: string,
        @Req() req: SolumRequest
    ) {
        const emailList = (emails ?? "")
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean);

        if (emailList.length === 0) {
            throw new InvalidQueryParameterException("Query param 'emails' is required (comma-separated list of emails)");
        }

        const parsedLimit = Math.min(Math.max(parseInt(limit ?? "10", 10) || 10, 1), 100);

        req.log.info({ emails: emailList, limit: parsedLimit }, "Finding recent users by emails");

        const users = await this.userService.findRecentByEmails(emailList, parsedLimit);
        return users.map(UserResponseDto.fromEntity);
    }

    @Get("/:id")
    @ResponseStatus(200)
    async getUserById(@Param("id") id: string, @Req() req: SolumRequest) {
        req.log.info({ param: id }, "Get user by id");

        const user = await this.userService.getUserById(id);

        req.log.info({ param: id }, "Get user successfully");
        return UserResponseDto.fromEntity(user);
    }

    @ExceptionHandler(BadRequestException)
    handleDuplicateEmail(err: BadRequestException, req: SolumRequest) {
        req.log.warn({ path: req.path }, err.message);
        return { status: "error", code: "USER_EMAIL_CONFLICT", message: err.message };
    }
}