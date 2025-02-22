import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { RegisterAuthDto } from './dto/register-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  authLogin(@Body() LoginAuthDto: LoginAuthDto) {
    return this.authService.authLogin(LoginAuthDto);
  }

  @Post('register')
  authRegister(@Body() registerDto: RegisterAuthDto) {
    return this.authService.authRegister(registerDto);
  }
}
