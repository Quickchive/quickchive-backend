import { MigrationInterface, QueryRunner } from "typeorm";

export class userprofileimage1699435419691 implements MigrationInterface {
    name = 'userprofileimage1699435419691'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" ADD "profileImage" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "profileImage"`);
    }

}
