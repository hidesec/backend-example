export class HttpException extends Error {
    constructor(public statusCode: number, message: string) {
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

export class NotFoundException extends HttpException {
    constructor(message: string) {
        super(404, message);
    }
}

export class BadRequestException extends HttpException {
    constructor(message: string) {
        super(400, message);
    }
}

export class ServiceUnavailableException extends HttpException {
    constructor(message: string) {
        super(503, message);
    }
}