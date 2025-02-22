import { IsNotEmpty } from "class-validator";

export class AddressDto {
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