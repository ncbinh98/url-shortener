import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddExpiredShortlink1769604278171 implements MigrationInterface {
  name = 'AddExpiredShortlink1769604278171';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "short-links" ADD "expiredAt" TIMESTAMP WITH TIME ZONE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "short-links" DROP COLUMN "expiredAt"`,
    );
  }
}
