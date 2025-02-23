import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { dataSourceOption } from "db/data-source";
import { AccessStrategy } from "src/common/guards/access.strategy";
import { RefreshStrategy } from "src/common/guards/refresh.strategy";

@Module({
    imports: [
        TypeOrmModule.forRoot(dataSourceOption),
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: `.env.${process.env.NODE_ENV || "development"}`
        }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET'),
                signOptions: { expiresIn: configService.get<string>('JWT_EXPIRATION') }
            })
        }),
        PassportModule.register({ defaultStrategy: 'jwt' })
    ],
    providers: [ConfigService, AccessStrategy, RefreshStrategy],
    exports: [ConfigService],
})
export class AppConfigModule { }