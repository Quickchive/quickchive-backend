import { MigrationInterface, QueryRunner } from "typeorm";

export class updateReadDeadlineNameToReminder1678797251031 implements MigrationInterface {
    name = 'updateReadDeadlineNameToReminder1678797251031'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "content" RENAME COLUMN "deadline" TO "reminder"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "content" RENAME COLUMN "reminder" TO "deadline"`);
    }

}
