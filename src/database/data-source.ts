import "dotenv/config";
import { Invoice } from '../modules/invoice/entities/invoice.entity';
import { Address } from '../modules/order/entities/address.entity';
import { Order } from '../modules/order/entities/order.entity';
import { Product } from '../modules/product/entities/product.entity';
import { User } from '../modules/user/entities/user.entity';
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
    type: 'mysql', // یا postgres
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'password',
    database: process.env.DB_NAME || 'ecommerce',
    entities: [User, Product, Order, Invoice, Address], // تمام Entityها
    migrations: ['dist/database/migrations/*.js'],
    migrationsTableName: 'migrations_history', // جدول ثبت Migrationها
    logging: true,
    synchronize: false,
});

AppDataSource.initialize()
    .then(() => {
        console.log('Data Source has been initialized!');
    })
    .catch((err) => {
        console.error('Error during Data Source initialization:', err);
    });