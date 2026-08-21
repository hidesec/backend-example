import { SolumRequest } from "@http/http-types";
import { getFrameworkLogger } from "@core/framework-logger";
import { ControllerAdvice, ExceptionHandler } from "@decorators/exception-handler.decorator";
import {
    BadRequestException,
    ForbiddenException,
    HttpException,
    InvalidQueryParameterException,
    NotFoundException,
    ServiceUnavailableException,
    UnauthorizedException,
} from "@exceptions/http-exceptions";

@ControllerAdvice()
export class GlobalExceptionAdvice {
    @ExceptionHandler(NotFoundException)
    handleNotFound(err: NotFoundException, req: SolumRequest) {
        getFrameworkLogger().warn({ path: req.path, statusCode: err.statusCode }, err.message);
        return { status: "error", code: "NOT_FOUND", message: err.message };
    }

    @ExceptionHandler(BadRequestException)
    handleBadRequest(err: BadRequestException, req: SolumRequest) {
        getFrameworkLogger().warn({ path: req.path, statusCode: err.statusCode }, err.message);
        return { status: "error", code: "BAD_REQUEST", message: err.message };
    }

    @ExceptionHandler(InvalidQueryParameterException)
    handleInvalidQueryParameter(err: InvalidQueryParameterException, req: SolumRequest) {
        getFrameworkLogger().warn({ path: req.path, statusCode: err.statusCode }, err.message);
        return { status: "error", code: "INVALID_QUERY_PARAMETER", message: err.message };
    }

    @ExceptionHandler(ServiceUnavailableException)
    handleServiceUnavailable(err: ServiceUnavailableException, req: SolumRequest) {
        getFrameworkLogger().warn({ path: req.path, statusCode: err.statusCode }, err.message);
        return { status: "error", code: "SERVICE_UNAVAILABLE", message: err.message };
    }

    @ExceptionHandler(UnauthorizedException)
    handleUnauthorized(err: UnauthorizedException, req: SolumRequest) {
        getFrameworkLogger().warn({ path: req.path, statusCode: err.statusCode }, err.message);
        return { status: "error", code: "UNAUTHORIZED", message: err.message };
    }

    @ExceptionHandler(ForbiddenException)
    handleForbidden(err: ForbiddenException, req: SolumRequest) {
        getFrameworkLogger().warn({ path: req.path, statusCode: err.statusCode }, err.message);
        return { status: "error", code: "FORBIDDEN", message: err.message };
    }

    @ExceptionHandler(HttpException)
    handleHttpException(err: HttpException, req: SolumRequest) {
        getFrameworkLogger().warn({ path: req.path, statusCode: err.statusCode }, err.message);
        return { status: "error", message: err.message };
    }
}