import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { logger } from 'src/main';

@Injectable()
export class SuccessInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const method = context.getHandler().name;
    const httpMethod = context.switchToHttp().getRequest().method;
    const url = context.switchToHttp().getRequest().url;
    const body = context.switchToHttp().getRequest().body;

    logger.info({ time: new Date(), method, httpMethod, url, body });

    return next.handle().pipe(
      map((returnValue) => {
        const statusCode: number = context
          .switchToHttp()
          .getResponse().statusCode;
        return {
          statusCode: statusCode,
          ...returnValue,
        };
      }),
    );
  }
}
