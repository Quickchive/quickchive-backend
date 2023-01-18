import { MigrationInterface, QueryRunner } from "typeorm";

export class removeSavesColumn1674029762201 implements MigrationInterface {
    name = 'removeSavesColumn1674029762201'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "saves"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "category" ADD "saves" integer NOT NULL DEFAULT '0'`);
    }

}
