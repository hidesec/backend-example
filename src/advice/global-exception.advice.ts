import { Request } from "express";
import { logger } from "@config/logger";
import { ControllerAdvice, ExceptionHandler } from "@decorators/exception-handler.decorator";
import {
    BadRequestException,
    HttpException,
    InvalidQueryParameterException,
    NotFoundException,
    ServiceUnavailableException,
} from "@exceptions/http-exceptions";

@ControllerAdvice()
export class GlobalExceptionAdvice {
    @ExceptionHandler(NotFoundException)
    handleNotFound(err: NotFoundException, req: Request) {
        logger.warn({ path: req.path, statusCode: err.statusCode }, err.message);
        return { status: "error", code: "NOT_FOUND", message: err.message };
    }

    @ExceptionHandler(BadRequestException)
    handleBadRequest(err: BadRequestException, req: Request) {
        logger.warn({ path: req.path, statusCode: err.statusCode }, err.message);
        return { status: "error", code: "BAD_REQUEST", message: err.message };
    }

    @ExceptionHandler(InvalidQueryParameterException)
    handleInvalidQueryParameter(err: InvalidQueryParameterException, req: Request) {
        logger.warn({ path: req.path, statusCode: err.statusCode }, err.message);
        return { status: "error", code: "INVALID_QUERY_PARAMETER", message: err.message };
    }

    @ExceptionHandler(ServiceUnavailableException)
    handleServiceUnavailable(err: ServiceUnavailableException, req: Request) {
        logger.warn({ path: req.path, statusCode: err.statusCode }, err.message);
        return { status: "error", code: "SERVICE_UNAVAILABLE", message: err.message };
    }

    @ExceptionHandler(HttpException)
    handleHttpException(err: HttpException, req: Request) {
        logger.warn({ path: req.path, statusCode: err.statusCode }, err.message);
        return { status: "error", message: err.message };
    }
}