import { IsIn } from "@validation/decorators";
import { USER_ROLES, UserRole } from "@auth/roles";

export class UpdateRoleDto {
    @IsIn(USER_ROLES as unknown as string[])
    role!: UserRole;
}
