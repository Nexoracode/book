import { IsNotEmpty, IsNumber } from "class-validator";

export class UpdateProductDto {
    @IsNotEmpty()
    name: string;

    @IsNotEmpty()
    description: string;

    @IsNotEmpty()
    @IsNumber()
    price: number;

    discount?: number;

    @IsNotEmpty()
    @IsNumber()
    stock: number;
}
