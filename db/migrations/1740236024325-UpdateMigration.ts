import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateMigration1740236024325 implements MigrationInterface {
    name = 'UpdateMigration1740236024325'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`test\``);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`test\` varchar(255) NOT NULL`);
    }

}
