import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMigration1740999999999 implements MigrationInterface {
    name = 'CreateMigration1740999999999'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`discount\` (
                \`id\`          INT NOT NULL AUTO_INCREMENT,
                \`code\`        VARCHAR(255) NOT NULL,
                \`type\`        ENUM('percentage', 'fixed') NOT NULL DEFAULT 'percentage',
                \`value\`       DECIMAL(10, 2) NOT NULL,
                \`max_uses\`    INT NULL DEFAULT NULL,
                \`used_count\`  INT NOT NULL DEFAULT 0,
                \`expires_at\`  TIMESTAMP NULL DEFAULT NULL,
                \`is_active\`   TINYINT NOT NULL DEFAULT 1,
                \`created_at\`  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\`  DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`IDX_discount_code\` (\`code\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`discount\``);
    }
}
