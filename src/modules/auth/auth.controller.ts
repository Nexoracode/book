import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Res, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { Response, Request } from 'express';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  authRegister(@Body() registerDto: RegisterAuthDto) {
    return this.authService.authRegister(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  authLogin(@Res() res: Response, @Body() LoginAuthDto: LoginAuthDto) {
    return this.authService.authLogin(res, LoginAuthDto);
  }


  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  authRefreshToken(@Req() req: Request, @Res() res: Response) {
    return this.authService.authRefreshToken(req, res);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  authLogout(@Req() req: Request, @Res() res: Response) {
    return this.authService.authLogout(req, res);
  }
}
