import { DataSource, QueryRunner } from 'typeorm';

//initalize the database
export default async function init(
  dataSource: DataSource,
): Promise<QueryRunner> {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  return queryRunner;
}
