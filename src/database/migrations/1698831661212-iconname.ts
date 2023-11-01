import { MigrationInterface, QueryRunner } from "typeorm";

export class iconname1698831661212 implements MigrationInterface {
    name = 'iconname1698831661212'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."category_iconname_enum" AS ENUM('None', 'Trip', 'Game', 'Book', 'Document', 'Shopping', 'Gift', 'Folder', 'Star', 'Cake', 'Cafe', 'Cook', 'Watch')`);
        await queryRunner.query(`ALTER TABLE "category" ADD "iconName" "public"."category_iconname_enum" NOT NULL DEFAULT 'None'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "iconName"`);
        await queryRunner.query(`DROP TYPE "public"."category_iconname_enum"`);
    }

}
