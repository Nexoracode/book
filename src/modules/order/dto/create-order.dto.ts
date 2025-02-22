import { PartialType } from "@nestjs/mapped-types";
import { IsNotEmpty } from "class-validator";
import { CreateUserDto } from "src/modules/user/dto/create-user.dto";
import { AddressDto } from "./create-address-dto";

export class CreateOrderDto extends PartialType(AddressDto) {
    @IsNotEmpty()
    firstName: string;

    @IsNotEmpty()
    lastName: string;

    @IsNotEmpty()
    phone: string;

    @IsNotEmpty()
    productId: number;

    @IsNotEmpty()
    quantity: number;
}
