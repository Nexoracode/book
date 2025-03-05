import { CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { Response, Request } from "express";
import { AuthService } from "src/modules/auth/auth.service";
import * as bcrypt from 'bcrypt';
import { TokenType, UtilToken } from "../utils/token.util";
import { UtilCookie } from "../utils/cookie.util";

export class AutoRefreshGuard implements CanActivate {
  constructor(
    private readonly tokenService: UtilToken,
    private readonly cookieService: UtilCookie,
    private readonly authService: AuthService,
  ) { }

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();

    const excludeRoutes = ['/api/auth/login', '/api/auth/register'];
    if (excludeRoutes.includes(req.path)) {
      return true;
    }

    const accessToken = req.cookies.access_token;
    const refreshToken = req.cookies.refresh_token;
    if (!accessToken && !refreshToken) {
      return true;
    }
    try {
      this.tokenService.verifyToken(accessToken, TokenType.ACCESS);
      return true;
    } catch (e) {
      if (!refreshToken) throw new UnauthorizedException('refresh token required');
      try {
        const decode = this.tokenService.verifyToken(refreshToken, TokenType.REFRESH);
        const employee = await this.authService.validationEmployee(decode.sub);
        const isMatch = await bcrypt.compare(refreshToken, employee.api_token!);
        if (!isMatch) {
          throw new UnauthorizedException('token is not validate')
        }
        const payload = { sub: employee.id, phone: employee.phone, role: employee.role }
        const newAccessToken = this.tokenService.generateToken(payload, TokenType.ACCESS);
        this.cookieService.setCookie(res, newAccessToken, TokenType.ACCESS);
        req.cookies.access_token = newAccessToken;
        return true;
      } catch (e) {
        throw new UnauthorizedException('شما اجازه دسترسی به این بخش را ندارید.');
      }
    }
  }

}