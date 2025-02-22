import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMigration1740251747387 implements MigrationInterface {
    name = 'CreateMigration1740251747387'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`test\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`test\` varchar(255) NOT NULL`);
    }

}
