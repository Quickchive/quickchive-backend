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
import { TypeOrmConfigService } from './database/typerom-config.service';

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
        MAILGUN_TEMPLATE_NAME_FOR_NOTIFICATION: Joi.string().required(),
        KAKAO_REST_API_KEY: Joi.string().required(),
        KAKAO_REDIRECT_URI_LOGIN: Joi.string().required(),
        KAKAO_CLIENT_SECRET: Joi.string().required(),
        KAKAO_JS_KEY: Joi.string().required(),
        GOOGLE_CLIENT_ID: Joi.string().required(),
        GOOGLE_SECRET: Joi.string().required(),
        GOOGLE_REDIRECT_URI: Joi.string().required(),
        NAVER_API_CLIENT_ID: Joi.string().required(),
        NAVER_API_CLIENT_SECRET: Joi.string().required(),
        NAVER_CLOVA_SUMMARY_REQUEST_URL: Joi.string().required(),
      }),
    }),
    TypeOrmModule.forRootAsync({
      useClass: TypeOrmConfigService,
      dataSourceFactory: async (options) => {
        const dataSource = await new DataSource(options).initialize();
        return dataSource;
      },
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
