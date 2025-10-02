import { LoginAuthDto } from './login-auth.dto';
import { CreateUserDto } from 'src/modules/user/dto/create-user.dto';
import { IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';

export class RegisterAuthDto extends PartialType(CreateUserDto) {

    @ApiProperty({ example: 'strongPassword123' })
    @IsNotEmpty({ message: 'رمز عبور خود را وارد نمایید.' })
    @MinLength(6)
    password: string
}
