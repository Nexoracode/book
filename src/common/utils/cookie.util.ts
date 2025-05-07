import { Response, request } from "express";
import { TokenType } from "./token.util";
export class UtilCookie {
    setCookie(res: Response, token: string, name: TokenType) {
        res.cookie(name, token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: name === TokenType.ACCESS ? 15 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000,
        })
    }

    clearCookie(res: Response, name: TokenType) {
        res.clearCookie(name, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
        })
    }
}