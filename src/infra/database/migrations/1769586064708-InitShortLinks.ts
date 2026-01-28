import { MigrationInterface, QueryRunner } from "typeorm";

export class InitShortLinks1769586064708 implements MigrationInterface {
    name = 'InitShortLinks1769586064708'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "short-links" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "originalUrl" text NOT NULL, "shortCode" character varying(255) NOT NULL, "createdBy" character varying(255) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_ca5697df92339be8f6604c40a1b" UNIQUE ("shortCode"), CONSTRAINT "PK_37df655059db4e24b5561d07b7f" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "short-links"`);
    }

}
