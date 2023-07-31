import { MigrationInterface, QueryRunner } from "typeorm";

export class paidplan1690802237057 implements MigrationInterface {
    name = 'paidplan1690802237057'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "paid_plan" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "name" character varying NOT NULL, "price" integer NOT NULL, "duration_days" integer NOT NULL, "description" character varying NOT NULL, CONSTRAINT "UQ_5f6dcbb8b0bcfdc9ce7b1458dcf" UNIQUE ("name"), CONSTRAINT "PK_8fa420e51bf179cd206d683d71a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "user" ADD "paidPlanId" integer`);
        await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_370e9cb04cf56f5b365035e8824" FOREIGN KEY ("paidPlanId") REFERENCES "paid_plan"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_370e9cb04cf56f5b365035e8824"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "paidPlanId"`);
        await queryRunner.query(`DROP TABLE "paid_plan"`);
    }

}
