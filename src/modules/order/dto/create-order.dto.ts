import { PartialType } from "@nestjs/mapped-types";
import { IsNotEmpty } from "class-validator";
import { CreateUserDto } from "src/modules/user/dto/create-user.dto";

export class CreateOrderDto extends PartialType(CreateUserDto) {
    @IsNotEmpty()
    productId: number;

    @IsNotEmpty()
    quantity: number;
}
