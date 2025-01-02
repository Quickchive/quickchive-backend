import { DataSource, DataSourceOptions } from 'typeorm';

/**
 * 아래 2줄은 로컬에서만 사용하는 코드이다.(.env.dev 파일을 사용하기 위함)
 * 배포 서버에선 docker container 내부에 이미 환경변수가 설정되어 있기 때문에
 * 아래 2줄은 주석처리한다.
 */
// import * as dotenv from 'dotenv';
// dotenv.config({ path: __dirname + '/../../.env.dev' });

export const AppDataSource = new DataSource({
  type: 'postgres',
  ...(process.env.POSTGRES_DB
    ? {
        host: process.env.POSTGRES_DB,
        port: process.env.DB_PORT ? +process.env.DB_PORT : undefined,
        username: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        database: process.env.POSTGRES_DB_NAME,
      }
    : {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT ? +process.env.DB_PORT : undefined,
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
} as DataSourceOptions);
