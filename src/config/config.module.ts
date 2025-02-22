import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { dataSourceOption } from "src/database/data-source";

@Module({
    imports: [
        TypeOrmModule.forRoot(dataSourceOption),
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: `.env.${process.env.NODE_ENV || "development"}`
        })
    ]
})
export class AppConfigModule { }