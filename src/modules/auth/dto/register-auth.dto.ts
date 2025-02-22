import { PartialType } from '@nestjs/mapped-types';
import { LoginAuthDto } from './login-auth.dto';
import { CreateUserDto } from 'src/modules/user/dto/create-user.dto';
import { IsNotEmpty, MinLength } from 'class-validator';

export class RegisterAuthDto extends PartialType(CreateUserDto) {
    @IsNotEmpty({ message: 'رمز عبور خود را وارد نمایید.' })
    @MinLength(6)
    password: string
}
