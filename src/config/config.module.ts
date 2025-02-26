import { Inject, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { dataSourceOption } from "db/data-source";
import { AccessStrategy } from "src/common/guards/access.strategy";
import { AutoRefreshGuard } from "src/common/guards/auto-refresh.guard";
import { RefreshStrategy } from "src/common/guards/refresh.strategy";
import { UtilCookie } from "src/common/utils/cookie.util";
import { UtilToken } from "src/common/utils/token.util";
import { AuthModule } from "src/modules/auth/auth.module";
import { AuthService } from "src/modules/auth/auth.service";

@Module({
    imports: [
        AuthModule,
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
    providers: [
        {
            provide: APP_GUARD,
            useFactory: (tokenService: UtilToken, cookieService: UtilCookie, authService: AuthService) => new AutoRefreshGuard(tokenService, cookieService, authService),
            inject: [UtilToken, UtilCookie, AuthService]
        },
        UtilToken,
        UtilCookie,
        ConfigService,
        AccessStrategy,
        RefreshStrategy,
    ],
    exports: [ConfigService],
})
export class AppConfigModule { }