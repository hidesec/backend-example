import { JwtAuthGuard } from "@auth/guards/jwt-auth.guard";
import { RolesGuard } from "@auth/guards/roles.guard";
import { JwtPayload } from "@auth/jwt.service.interface";
import { UserRole } from "@auth/roles";
import { SolumRequest } from "@http/http-types";
import { parsePageable } from "@http/pagination";
import { UserResponseDto } from "@dto/user-response.dto";
import { CreateUserDto } from "@dto/create-user.dto";
import { UpdateRoleDto } from "@dto/update-role.dto";
import { IUserService } from "@services/user.service.interface";
import { RestController, Get, Post, Delete, Patch } from "@decorators/route.decorator";
import { ResponseStatus } from "@decorators/response.decorator";
import { AutoWired } from "@decorators/autowired.decorator";
import { ExceptionHandler } from "@decorators/exception-handler.decorator";
import { UseGuards, Roles } from "@decorators/guard.decorator";
import { Body, CurrentUser, Param, Query, Req, Valid } from "@decorators/param.decorator";
import { BadRequestException, InvalidQueryParameterException } from "@exceptions/http-exceptions";

@RestController("/users")
export class UserController {
    @AutoWired("IUserService")
    declare private userService: IUserService;

    @Post("/")
    @ResponseStatus(201)
    async createUser(@Valid({ whitelist: true }) @Body() dto: CreateUserDto, @Req() req: SolumRequest) {
        req.log.info({ body: { email: dto.email } }, "Creating new user");
        const user = await this.userService.createUser(dto);
        req.log.info({ userId: user.id }, "User created successfully");
        return UserResponseDto.fromEntity(user);
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

    @Get("/")
    @ResponseStatus(200)
    async listUsers(@Query() query: Record<string, unknown>, @Req() req: SolumRequest) {
        const pageable = parsePageable(query);
        req.log.info({ page: pageable.page, size: pageable.size, sorts: pageable.sorts }, "Listing users");
        const page = await this.userService.findPage(pageable);
        return { ...page, content: page.content.map(UserResponseDto.fromEntity) };
    }

    @Get("/me")
    @ResponseStatus(200)
    @UseGuards(JwtAuthGuard)
    async me(@CurrentUser() principal: JwtPayload, @Req() req: SolumRequest) {
        req.log.info({ userId: principal.sub }, "Fetching current user profile");
        return UserResponseDto.fromEntity(await this.userService.getUserById(principal.sub));
    }

    @Get("/:id")
    @ResponseStatus(200)
    async getUserById(@Param("id") id: string, @Req() req: SolumRequest) {
        req.log.info({ param: id }, "Get user by id");

        const user = await this.userService.getUserById(id);

        req.log.info({ param: id }, "Get user successfully");
        return UserResponseDto.fromEntity(user);
    }

    @Delete("/:id")
    @ResponseStatus(200)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles("ADMIN")
    async deleteUser(@Param("id") id: string, @Req() req: SolumRequest) {
        req.log.info({ param: id }, "Deleting user");
        await this.userService.deleteUser(id);
        return { status: "success", message: `User ${id} deleted` };
    }

    @Patch("/:id/role")
    @ResponseStatus(200)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles("ADMIN")
    async updateRole(
        @Param("id") id: string,
        @Valid() @Body() dto: UpdateRoleDto,
        @Req() req: SolumRequest
    ): Promise<UserResponseDto> {
        req.log.info({ param: id, role: dto.role }, "Updating user role");
        return UserResponseDto.fromEntity(await this.userService.updateRole(id, dto.role as UserRole));
    }

    @ExceptionHandler(BadRequestException)
    handleDuplicateEmail(err: BadRequestException, req: SolumRequest) {
        req.log.warn({ path: req.path }, err.message);
        return { status: "error", code: "USER_EMAIL_CONFLICT", message: err.message };
    }
}
