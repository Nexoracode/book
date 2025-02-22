import { IsNotEmpty, MinLength } from "class-validator";

export class LoginAuthDto {
    @IsNotEmpty()
    phone: string;

    @IsNotEmpty()
    @MinLength(6)
    password: string;
}
