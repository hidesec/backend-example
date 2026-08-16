import { IUserService } from "services/user.service.interface";
import { inject, injectable } from "tsyringe";
import { Request, Response, NextFunction } from "express";
import { UserResponseDto } from "dto/user-response.dto";

@injectable()
export class UserController {
    constructor(
        @inject("IUserService") private readonly userService: IUserService
    ) {}

    createUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const user = await this.userService.createUser(req.body as any);
            res.status(201).json(user);
        } catch (err) {
            next(err);
        }
    }

    getUserById = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const user = await this.userService.getUserById(id);
            if (!user) {
                res.status(404).json({ message: "User not found" });
                return;
            }

            res.status(200).json(UserResponseDto.fromEntity(user));
        } catch (err) {
            next(err);
        }
    }
}