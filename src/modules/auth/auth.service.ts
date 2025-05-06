import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { LoginAuthDto } from './dto/login-auth.dto';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TokenType, UtilToken } from 'src/common/utils/token.util';
import { UtilCookie } from 'src/common/utils/cookie.util';
import { Response, Request } from 'express';
import { Employees } from '../employees/entities/employee.entity';
import { EmployeesService } from '../employees/employees.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Employees)
    private authRepo: Repository<Employees>,
    private employeeService: EmployeesService,
    private tokenService: UtilToken,
    private cookieService: UtilCookie,
  ) { }

  async validationEmployee(id: number) {
    const employee = await this.authRepo.findOne({
      where: { id }, select: [
        'id', 'firstName', 'lastName', 'password', 'api_token', 'role',
      ]
    });
    if (!employee) {
      throw new NotFoundException('employee not found');
    }
    return employee;
  }

  async authRegister(registerDto: RegisterAuthDto) {
    const employee = await this.employeeService.findPhoneOne(registerDto.phone!);
    if (employee) {
      throw new BadRequestException('کاربری با این شماره وجود دارد');
    } else {
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);
      registerDto.password = hashedPassword;
      const newEmployee = this.authRepo.create(registerDto);
      await this.authRepo.save(newEmployee);
      const { password, ...result } = newEmployee;
      return {
        message: 'register user successfully',
        statusCode: 201,
        data: {
          employee: result,
        }
      }
    }
  }

  async authLogin(res: Response, loginAuthDto: LoginAuthDto) {
    try {
      const employee = await this.employeeService.findPhoneOne(loginAuthDto.phone);
      if (!employee || !employee.password || !await bcrypt.compare(loginAuthDto.password, employee.password!)) {
        throw new UnauthorizedException('نام کاربری یا رمز عبور، صحیح نمی باشد');
      }
      const payload = { sub: employee.id, phone: employee.phone, role: employee.role };
      const accessToken = this.tokenService.generateToken(payload, TokenType.ACCESS);
      const refreshToken = this.tokenService.generateToken(payload, TokenType.REFRESH);
      const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
      employee.api_token = hashedRefreshToken;
      await this.authRepo.save(employee);
      this.cookieService.setCookie(res, accessToken, TokenType.ACCESS);
      this.cookieService.setCookie(res, refreshToken, TokenType.REFRESH);
      const { password, api_token, role, ...result } = employee;
      res.json({
        message: 'login successfully',
        statusCode: 200,
        data: {
          employee: result,
        }
      })
    } catch (e) {
      throw new UnauthorizedException(e.message);
    }
  }

  async authLogout(req: Request, res: Response) {
    try {
      const token = req.cookies.refresh_token;
      if (!token) {
        throw new UnauthorizedException('token is missed');
      }
      const decode = this.tokenService.verifyToken(token, TokenType.REFRESH);
      const employee = await this.employeeService.findOne(decode.sub);
      const isMatch = await bcrypt.compare(token, employee.api_token!)
      if (!isMatch) {
        throw new UnauthorizedException('token is missed');
      }
      this.cookieService.clearCookie(res, TokenType.ACCESS);
      this.cookieService.clearCookie(res, TokenType.REFRESH);
      employee.api_token = '';
      await this.authRepo.save(employee);
      res.json({
        message: 'logout successfully',
        statusCode: 200,
        data: {}
      })
    } catch (e) {
      throw new UnauthorizedException(e.message);
    }
  }

  async authLoginToken(req: Request, res: Response) {
    try {
      const token = req.cookies.refresh_token;
      const decode = this.tokenService.verifyToken(token, TokenType.REFRESH);
      let employee = await this.authRepo.findOne({
        where: { id: decode.sub }, select: [
          'id', 'api_token', 'phone', 'firstName', 'lastName', 'role'
        ]
      });
      if (!employee) {
        throw new NotFoundException('کاربری بااین مشخصات یافت نشد')
      }
      const payload = { sub: employee.id, phone: employee.phone, role: employee.role };
      const accessToken = this.tokenService.generateToken(payload, TokenType.ACCESS);
      const refreshToken = this.tokenService.generateToken(payload, TokenType.REFRESH);
      const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
      employee.api_token = hashedRefreshToken;
      await this.authRepo.save(employee);
      this.cookieService.setCookie(res, accessToken, TokenType.ACCESS);
      this.cookieService.setCookie(res, refreshToken, TokenType.REFRESH);
      const { password, api_token, role, ...result } = employee;
      res.json({
        message: 'authentication successfully',
        statusCode: 200,
        data: {
          employee: result,
        }
      })
    } catch (e) {
      console.log(e);
      throw new UnauthorizedException('token is not validate');
    }
  }

}
