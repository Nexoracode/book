import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Logger } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;
        const errorResponse =
            exception instanceof HttpException
                ? (exception.getResponse() as any)
                : { message: 'Internal Server Error' };

        const errorMessage =
            typeof errorResponse === 'string' ? errorResponse : errorResponse.message;

        const errorObject = {
            statusCode: status,
            success: false,
            message: errorMessage || 'An unexpected error occurred',
            timestamp: new Date().toISOString(),
            path: ctx.getRequest().url,
        };

        this.logger.error(
            `\n🔴 EXCEPTION ERROR :  \n
            STATUS CODE -> ${errorObject.statusCode}
            MESSAGE -> ${errorObject.message}
            PATH -> ${errorObject.path}`,
        );
        response.status(status).json(errorObject);
    }
}
