import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/exceptions/http-exception.filter';
import { SuccessInterceptor } from './common/interceptors/success.interceptor';

export const logger = winston.createLogger({
  transports: [
    new DailyRotateFile({
      filename: 'errors-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '1024',
      level: 'error',
    }),
  ],
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    logger: logger,
  });
  app.useGlobalInterceptors(new SuccessInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(new ValidationPipe());
  app.getHttpServer().setTimeout(20000);
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Bookmark Service Demo')
    .setDescription('The simple API description')
    .setVersion('0.1')
    .addTag('Demo Version')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'Authorization',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.PORT || 4000);
}
bootstrap();
