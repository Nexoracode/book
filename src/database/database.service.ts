import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DatabaseService {
    constructor(private dataSource: DataSource) { }

    async deleteDatabase() {
        const allowedEnvs = ['development', 'test']; // فقط این محیط‌ها اجازه دارند
        if (!allowedEnvs.includes(`${process.env.NODE_ENV}`)) {
            throw new Error(`🚨 Clearing database is not allowed in ${process.env.NODE_ENV} environment!`);
        }
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
            await queryRunner.query(`SET FOREIGN_KEY_CHECKS = 0;`);
            const tables = await queryRunner.query(`SHOW TABLES`);
            for (const table of tables) {
                const tableName = Object.values(table)[0];
                await queryRunner.query(`DROP TABLE ${tableName}`);
            }
            await queryRunner.query(`SET FOREIGN_KEY_CHECKS = 1;`);
            await queryRunner.commitTransaction();
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
}