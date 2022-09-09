import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { logger } from '../logger';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const error = exception.getResponse() as {
      error: string;
      statusCode: number;
      message: string | string[];
    };

    logger.error({ time: new Date(), ...exception });

    console.log(exception);
    typeof error === 'string'
      ? response.status(status).json({
          statusCode: status,
          message: error,
        })
      : response.status(status).json({
          statusCode: status,
          ...error,
        });
  }
}
