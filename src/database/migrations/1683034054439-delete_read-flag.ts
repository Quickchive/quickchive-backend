import { MigrationInterface, QueryRunner } from "typeorm";

export class deleteReadFlag1683034054439 implements MigrationInterface {
    name = 'deleteReadFlag1683034054439'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "content" DROP COLUMN "readFlag"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "content" ADD "readFlag" boolean NOT NULL DEFAULT false`);
    }

}
