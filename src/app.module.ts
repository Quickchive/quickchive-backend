import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { User } from './users/entities/user.entity';
import { ContentsModule } from './contents/contents.module';
import { Content } from './contents/entities/content.entity';
import { Category } from './contents/entities/category.entity';
import { DataSource } from 'typeorm';
import * as Joi from 'joi';
import { CollectionsModule } from './collections/collections.module';
import { Collection } from './collections/entities/collection.entity';
import { NestedContent } from './collections/entities/nested-content.entity';
import { BatchModule } from './batch/batch.module';
import { SummaryModule } from './summary/summary.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        process.env.NODE_ENV === 'dev'
          ? '.env.dev'
          : process.env.NODE_ENV === 'prod'
          ? '.env.prod'
          : '.env.test',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('dev', 'prod', 'test').required(),
        DB_HOST: Joi.string(),
        DB_PORT: Joi.string(),
        DB_USERNAME: Joi.string(),
        DB_PW: Joi.string(),
        DB_NAME: Joi.string(),
        POSTGRES_DB: Joi.string(),
        POSTGRES_USER: Joi.string(),
        POSTGRES_PASSWORD: Joi.string(),
        REDIS_HOST: Joi.string(),
        REDIS_PORT: Joi.string(),
        JWT_ACCESS_TOKEN_PRIVATE_KEY: Joi.string().required(),
        JWT_REFRESH_TOKEN_PRIVATE_KEY: Joi.string().required(),
        MAILGUN_API_KEY: Joi.string().required(),
        MAILGUN_DOMAIN_NAME: Joi.string().required(),
        MAILGUN_TEMPLATE_NAME_FOR_VERIFY_EMAIL: Joi.string().required(),
        MAILGUN_TEMPLATE_NAME_FOR_RESET_PASSWORD: Joi.string().required(),
      }),
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      ...(process.env.POSTGRES_DB
        ? {
            host: process.env.POSTGRES_DB,
            port: +process.env.DB_PORT,
            username: process.env.POSTGRES_USER,
            password: process.env.POSTGRES_PASSWORD,
          }
        : {
            host: process.env.DB_HOST,
            port: +process.env.DB_PORT,
            username: process.env.DB_USERNAME,
            password: process.env.DB_PW,
            database: process.env.DB_NAME,
          }),
      maxQueryExecutionTime: 10000, // If query execution time exceed this given max execution time (in milliseconds) then logger will log this query.
      extra: {
        statement_timeout: 10000, // timeout in milliseconds
      },
      synchronize: process.env.NODE_ENV !== 'prod',
      logging:
        process.env.NODE_ENV !== 'prod' && process.env.NODE_ENV !== 'test',
      entities: [User, Content, Category, Collection, NestedContent],
    }),
    UsersModule,
    CommonModule,
    AuthModule,
    MailModule.forRoot({
      apiKey: process.env.MAILGUN_API_KEY,
      domain: process.env.MAILGUN_DOMAIN_NAME,
      templateNameForVerifyEmail:
        process.env.MAILGUN_TEMPLATE_NAME_FOR_VERIFY_EMAIL,
      templateNameForResetPassword:
        process.env.MAILGUN_TEMPLATE_NAME_FOR_RESET_PASSWORD,
      templateNameForNotification:
        process.env.MAILGUN_TEMPLATE_NAME_FOR_NOTIFICATION,
    }),
    ContentsModule,
    CollectionsModule,
    BatchModule,
    SummaryModule.forRoot({
      apiClientId: process.env.NAVER_API_CLIENT_ID,
      apiClientSecret: process.env.NAVER_API_CLIENT_SECRET,
      clovaSummaryRequestUrl: process.env.NAVER_CLOVA_SUMMARY_REQUEST_URL,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  constructor(private dataSource: DataSource) {}
}
