import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Invoice } from 'src/modules/invoice/entities/invoice.entity';
import { Address } from 'src/modules/order/entities/address.entity';
import { Order } from 'src/modules/order/entities/order.entity';
import { Product } from 'src/modules/product/entities/product.entity';
import { User } from 'src/modules/user/entities/user.entity';

export const typeOrmConfig: TypeOrmModuleOptions = {
    type: 'mysql', // یا 'postgres'
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'password',
    database: process.env.DB_NAME || 'ecommerce',
    entities: [User, Product, Order, Address, Invoice],
    autoLoadEntities: true,
    synchronize: false, // نباید در Production فعال باشد
};
