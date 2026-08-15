import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { BadRequestException } from "exceptions/http-exceptions";
import { NextFunction, Request, Response } from "express";

export function validateDto<T extends object>(dtoClass: new () => T) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const dtoObj = plainToInstance(dtoClass, req.body);
        const errors = await validate(dtoObj);

        if (errors.length > 0) {
            const message = errors
            .map((e) => Object.values(e.constraints ?? {}))
            .flat()
            .join(", ");
            
            return next(new BadRequestException(message));
        }

        (req as any).body = dtoObj;
        next();
    }
}