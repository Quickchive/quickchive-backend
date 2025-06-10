import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { logger } from '../logger';

class ErrorResponse {
  statusCode: number;
  path: string;
  message: string;
  data?: any;

  constructor({
    statusCode,
    path,
    message,
    data,
  }: {
    statusCode: number;
    path: string;
    message: string;
    data?: any;
  }) {
    this.statusCode = statusCode;
    this.path = path;
    this.message = message;
    this.data = data;
  }
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const { ip, method, url } = request;
    logger.error(
      `${method} - ${url} - ${ip.split(':').at(-1)} - ${JSON.stringify(
        exception,
      )}`,
    );

    const exceptionResponse = exception.getResponse() as {
      error: string;
      message?: string | string[];
      data?: any;
    };
    const exceptionMessage = (() => {
      if (
        exceptionResponse?.message &&
        Array.isArray(exceptionResponse.message)
      ) {
        return exceptionResponse.message.join(' ');
      }

      return exception.message;
    })();

    response.status(status).json(
      new ErrorResponse({
        statusCode: status,
        path: request.url,
        message: exceptionMessage,
        data: exceptionResponse?.data,
      }),
    );
  }
}
