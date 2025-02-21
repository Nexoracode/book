import * as dotenv from "dotenv";
const envFile = `.env.${process.env.NODE_ENV || "development"}`;
dotenv.config({ path: envFile });
import { DataSource, DataSourceOptions } from 'typeorm';

export const dataSourceOption: DataSourceOptions = {
    type: 'mysql',
    host: "book-db",
    port: 3306,
    username: "root",
    password: "WV85ZzLWVy6fJRkddQRdNCzh",
    database: "elegant_liskov",
    entities: ['dist/**/*.entity{.js,.ts}'],
    migrations: [__dirname + '/migrations/*.js'],
    logging: false,
    synchronize: process.env.NODE_ENV === 'development',
};

const dataSource = new DataSource(dataSourceOption);
export default dataSource;

console.log(process.env.NODE_ENV)