import { IsJWT } from "@validation/decorators";

export class RefreshTokenDto {
    @IsJWT()
    refreshToken!: string;
}
