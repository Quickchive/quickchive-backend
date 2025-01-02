import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { DataSource, DataSourceOptions } from 'typeorm';

export const getBuilder = async () => {
  const container = await new PostgreSqlContainer()
    .withDatabase('quickchive_test')
    .withReuse()
    .start();

  const dbConfigOption: DataSourceOptions = {
    type: 'postgres',
    host: container.getHost(),
    port: container.getMappedPort(5432),
    username: container.getUsername(),
    password: container.getPassword(),
    database: container.getDatabase(),
    entities: [__dirname + '/../../src/**/*.entity{.ts,.js}'],
    synchronize: true,
  };

  const dataSource = await new DataSource(dbConfigOption).initialize();

  return {
    builder: Test.createTestingModule({
      imports: [AppModule],
    }),
    container,
    dataSource,
  };
};
