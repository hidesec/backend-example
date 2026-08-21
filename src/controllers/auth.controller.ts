import { IAuthService } from "@auth/auth.service.interface";
import { AutoWired } from "@decorators/autowired.decorator";
import { Post, RestController } from "@decorators/route.decorator";
import { ResponseStatus } from "@decorators/response.decorator";
import { Body, Valid } from "@decorators/param.decorator";
import { LoginRequestDto } from "@dto/login.dto";
import { RefreshTokenDto } from "@dto/refresh-token.dto";

@RestController("/auth")
export class AuthController {
    @AutoWired("IAuthService")
    declare private authService: IAuthService;

    @Post("/login")
    @ResponseStatus(200)
    async login(@Valid() @Body() dto: LoginRequestDto) {
        return this.authService.login(dto);
    }

    @Post("/refresh")
    @ResponseStatus(200)
    async refresh(@Valid() @Body() dto: RefreshTokenDto) {
        return this.authService.refresh(dto.refreshToken);
    }
}
