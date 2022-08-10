import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SuccessInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
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
