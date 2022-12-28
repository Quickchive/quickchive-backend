# TypeORM을 이용한 DB Migration

## typerom-config.service.ts

```typescript
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
  constructor(private configService: ConfigService) {}

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
      migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
    } as TypeOrmModuleOptions;
  }
}
```

기본적인 typeorm 설정

## ormconfig(data source)

```typescript
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config({ path: __dirname + '/../../.env.dev' });

export const AppDataSource = new DataSource({
  type: 'postgres',
  ...(process.env.POSTGRES_DB
    ? {
        host: process.env.POSTGRES_DB,
        port: +process.env.DB_PORT,
        username: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB_NAME,
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
  synchronize: false,
  logging: process.env.NODE_ENV !== 'prod' && process.env.NODE_ENV !== 'test',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
  cli: {
    entitiesDir: 'src/**/**',
    migrationsDir: 'src/database/migrations',
  },
} as DataSourceOptions);
```

typeorm cli를 사용하기 위한 설정

## package.json

```json
{
  ...
  "scripts": {
    ...
    "typeorm": "typeorm-ts-node-commonjs",
    "migration:generate": "npm run typeorm -- -d src/database/ormconfig.ts migration:generate",
    "migration:create": "npm run typeorm -- migration:create",
    "migration:run": "npm run typeorm -- -d src/database/ormconfig.ts migration:run"
  },
  ...
```

script를 통해 typeorm cli를 사용할 수 있도록 설정

<br/>

# 주의점

## generate

create랑 generate 모두 마이그레이션 파일을 생성하지만 둘 사이에는 큰 차이가 있다.  
create는 그냥 빈 파일만을 생성시켜 줄 뿐이지만  
generate는 db와 entity 사이의 차이점이 있다면 이를 파악하고 sql구문을 작성한다.  
그러나 컬럼의 길이 또는 타입 변경 시 해당 테이블의 컬럼을 DROP한 후 재생성하는 방식이기 때문에 기존 컬럼에 있던 데이터가 모두 삭제된다.
