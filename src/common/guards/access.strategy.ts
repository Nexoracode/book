import { UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { Request } from "express";
import { StrategyModel } from "./strategy.enum";

export class AccessStrategy extends PassportStrategy(Strategy, StrategyModel.ACCESS_STRATEGY) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([(req: Request) => {
                if (req && req.cookies) {
                    console.log('req', req.cookies.access_token)
                    return req.cookies.access_token;
                }
                return null;
            }]),
            secretOrKey: `${process.env.JWT_SECRET}`,
            ignoreExpiration: false,
        });
    }

    validate(payload: any): unknown {
        console.log('payload');
        if (!payload) {
            throw new UnauthorizedException('token is required');
        }
        return { sub: payload.sub, phone: payload.phone, role: payload.role };
    }

} 