import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateShortLink1769589571555 implements MigrationInterface {
    name = 'UpdateShortLink1769589571555'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "short-links" ADD "canonicalUrl" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "short-links" ADD "canonicalHash" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "short-links" ADD CONSTRAINT "UQ_e0cd640e7420a87b77c68c85a3a" UNIQUE ("canonicalHash")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "short-links" DROP CONSTRAINT "UQ_e0cd640e7420a87b77c68c85a3a"`);
        await queryRunner.query(`ALTER TABLE "short-links" DROP COLUMN "canonicalHash"`);
        await queryRunner.query(`ALTER TABLE "short-links" DROP COLUMN "canonicalUrl"`);
    }

}
