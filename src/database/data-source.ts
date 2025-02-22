import * as dotenv from "dotenv";
const envFile = `.env.${process.env.NODE_ENV || "development"}`;
dotenv.config({ path: envFile });
import { DataSource, DataSourceOptions } from 'typeorm';

// export const dataSourceOption: DataSourceOptions = {
//     type: 'mysql',
//     host: "academy",
//     port: 3306,
//     username: "root",
//     password: "CJJRGWDBxnSR6tAjPEevn0xs",
//     database: "namaz-bahal",
//     entities: ['dist/**/*.entity{.js,.ts}'],
//     migrations: [__dirname + '/migrations/*.js'],
//     logging: false,
//     synchronize: false,
// };

export const dataSourceOption: DataSourceOptions = {
    type: 'mysql',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: ['dist/**/*.entity{.js,.ts}'],
    migrations: [__dirname + '/migrations/*.js'],
    logging: false,
    synchronize: process.env.NODE_ENV === 'development',
};

const dataSource = new DataSource(dataSourceOption);
export default dataSource;

console.log(`.env.${process.env.NODE_ENV}`)