import { IsNotEmpty, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
export class AddressDto {

    @ApiProperty({ example: "خراسان شمالی" })
    @IsNotEmpty()
    province: string;

    @ApiProperty({ example: "بجنورد" })
    @IsNotEmpty()
    city: string;

    @ApiProperty({ example: "بلوار معلم" })
    @IsNotEmpty()
    street: string;

    @ApiProperty({ example: "12" })
    @IsNotEmpty()
    plaque: string;

    @ApiProperty({ example: "1234567890" })
    @IsOptional()
    @IsNotEmpty()
    postalCode: string;
}