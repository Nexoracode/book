import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { StrategyModel } from "./strategy.enum";
import { UnauthorizedException } from "@nestjs/common";
import { Request } from "express";

export class RefreshStrategy extends PassportStrategy(Strategy, StrategyModel.REFRESH_STRATEGY) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([(req: Request) => {
                if (req && req.cookies) {
                    return req.cookies.refresh_token;
                }
                return null;
            }]),
            secretOrKey: `${process.env.JWT_REFRESH_SECRET}`,
            ignoreExpiration: false,
        });
    }
    validate(payload: any): any {
        if (!payload) {
            throw new UnauthorizedException('token is required');
        }
        return { sub: payload.sub, phone: payload.phone, role: payload.phone }
    }

}