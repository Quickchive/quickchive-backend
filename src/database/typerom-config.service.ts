import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { Collection } from '../collections/entities/collection.entity';
import { NestedContent } from '../collections/entities/nested-content.entity';
import { Category } from '../contents/entities/category.entity';
import { Content } from '../contents/entities/content.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class TypeOrmConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {
    console.log(__dirname);
  }

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      ...(this.configService.get('POSTGRES_DB')
        ? {
            host: this.configService.get('POSTGRES_DB'),
            port: +this.configService.get('DB_PORT'),
            username: this.configService.get('POSTGRES_USER'),
            password: this.configService.get('POSTGRES_PASSWORD'),
            database: this.configService.get('POSTGRES_DB_NAME'),
          }
        : {
            host: this.configService.get('DB_HOST'),
            port: +this.configService.get('DB_PORT'),
            username: this.configService.get('DB_USERNAME'),
            password: this.configService.get('DB_PW'),
            database: this.configService.get('DB_NAME'),
          }),
      maxQueryExecutionTime: 10000, // If query execution time exceed this given max execution time (in milliseconds) then logger will log this query.
      extra: {
        statement_timeout: 10000, // timeout in milliseconds
      },
      synchronize: this.configService.get('NODE_ENV') !== 'prod',
      logging:
        this.configService.get('NODE_ENV') !== 'prod' &&
        this.configService.get('NODE_ENV') !== 'test',
      entities: [User, Content, Category, Collection, NestedContent],
      migrations: [__dirname + '/database/migrations/**/*{.ts,.js}'],
    } as TypeOrmModuleOptions;
  }
}
