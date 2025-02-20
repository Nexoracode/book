import { isNotEmpty, IsNotEmpty } from "class-validator";

export class CreateUserDto {
    @IsNotEmpty()
    firstName: string;

    @IsNotEmpty()
    lastName: string;

    @IsNotEmpty()
    phone: string;

    @IsNotEmpty()
    province: string;

    @IsNotEmpty()
    city: string;

    @IsNotEmpty()
    street: string;

    @IsNotEmpty()
    plaque: string;

    @IsNotEmpty()
    postalCode: string;
}
