import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { logger } from '../logger';

@Injectable()
export class SuccessInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // const method = context.getHandler().name;
    const { ip, method, url, body } = context.switchToHttp().getRequest();
    logger.info(
      `${method} - ${url} - ${ip.split(':').at(-1)} - body:${JSON.stringify(
        body,
      )}`,
    );

    return next.handle().pipe(
      map((returnValue) => {
        const statusCode: number = context
          .switchToHttp()
          .getResponse().statusCode;
        return {
          statusCode,
          ...returnValue,
        };
      }),
    );
  }
}
