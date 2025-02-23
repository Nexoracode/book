import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

export enum TokenType {
    ACCESS = 'access_token',
    REFRESH = 'refresh_token'
}

@Injectable()
export class UtilToken {
    constructor(
        private jwtService: JwtService
    ) { }
    generateToken(payload: any, type: TokenType) {
        return this.jwtService.sign(payload, {
            secret: type === TokenType.ACCESS ? process.env.JWT_SECRET : process.env.JWT_REFRESH_SECRET,
            expiresIn: type === TokenType.ACCESS ? process.env.JWT_EXPIRATION : process.env.JWT_REFRESH_EXPIRATION
        })
    }

    verifyToken(token: string, type: TokenType) {
        return this.jwtService.verify(token, {
            secret: type === TokenType.ACCESS ? process.env.JWT_SECRET : process.env.JWT_REFRESH_SECRET
        })
    }
}