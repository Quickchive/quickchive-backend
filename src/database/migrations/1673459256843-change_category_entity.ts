import { MigrationInterface, QueryRunner } from "typeorm";

export class changeCategoryEntity1673459256843 implements MigrationInterface {
    name = 'changeCategoryEntity1673459256843'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "category" ADD "saves" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "saves"`);
    }

}
