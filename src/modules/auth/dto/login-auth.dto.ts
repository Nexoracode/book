import { IsNotEmpty, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class LoginAuthDto {

    @ApiProperty({ name: 'phone', example: '1234567890' })
    @IsNotEmpty()
    phone: string;

    @ApiProperty({ name: 'password', example: 'password123' })
    @IsNotEmpty()
    @MinLength(6)
    password: string;
}
