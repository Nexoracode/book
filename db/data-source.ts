import * as dotenv from "dotenv";
const envFile = `.env.${process.env.NODE_ENV || "development"}`;
dotenv.config({ path: envFile });
import { DataSource, DataSourceOptions } from 'typeorm';

export const dataSourceOption: DataSourceOptions = {
    type: 'mysql',
    host: "book-db",
    port: 3306,
    username: "root",
    password: "XWxfzJFQN7rhXillQtPqJCI2",
    database: "namaz-bahal",
    entities: ['dist/**/*.entity{.js,.ts}'],
    migrations: [__dirname + '/migrations/*.js'],
    logging: false,
    synchronize: false,
};

// export const dataSourceOption: DataSourceOptions = {
//     type: 'mysql',
//     host: process.env.DATABASE_HOST,
//     port: Number(process.env.DATABASE_PORT),
//     username: process.env.DATABASE_USER,
//     password: process.env.DATABASE_PASS,
//     database: process.env.DATABASE_NAME,
//     entities: ['dist/**/*.entity{.js,.ts}'],
//     migrations: [__dirname + '/migrations/*.js'],
//     logging: false,
//     synchronize: process.env.NODE_ENV === 'development',
// };

const dataSource = new DataSource(dataSourceOption);
export default dataSource;

console.log(`.env.${process.env.NODE_ENV}`)