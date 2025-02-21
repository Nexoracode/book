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

const dataSource = new DataSource(dataSourceOption);
export default dataSource;

console.log(`.env.${process.env.NODE_ENV}`)