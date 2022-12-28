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
} as DataSourceOptions);
