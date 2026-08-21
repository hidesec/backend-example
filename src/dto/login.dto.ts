import { IsEmail, IsString, MinLength } from "@validation/decorators";

export class LoginRequestDto {
    @IsEmail()
    email!: string;

    @IsString()
    @MinLength(1)
    password!: string;
}
