import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginAuthDto } from './dto/login-auth.dto';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private authRepo: Repository<User>,
    private readonly userService: UserService,
  ) { }

  async authLogin(loginAuthDto: LoginAuthDto) {
    const user = await this.userService.findPhoneOne(loginAuthDto.phone);
    if (!user || !await bcrypt.compare(loginAuthDto.password, user.password!)) {
      throw new UnauthorizedException('نام کاربری یا رمز عبور، صحیح نمی باشد');
    }
    const { password, ...result } = user;
    return {
      message: 'login successfully',
      statusCode: 200,
      data: {
        user: result,
      }
    }
  }


  async authRegister(registerDto: RegisterAuthDto) {
    const user = await this.userService.findPhoneOne(registerDto.phone!);
    if (user) {
      throw new BadRequestException('کاربری با این شماره وجود دارد');
    } else {
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);
      registerDto.password = hashedPassword;
      const newUser = await this.authRepo.create(registerDto);
      await this.authRepo.save(newUser);
      const { password, ...result } = newUser;
      return {
        message: 'register user successfully',
        statusCode: 201,
        data: {
          user: result,
        }
      }
    }
  }
}
