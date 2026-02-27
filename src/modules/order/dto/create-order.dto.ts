import { IsNotEmpty, IsOptional, IsString } from "class-validator";
import { CreateUserDto } from "src/modules/user/dto/create-user.dto";
import { AddressDto } from "./create-address-dto";
import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
export class CreateOrderDto extends PartialType(AddressDto) {

    @ApiProperty({ example: 'رضا' })
    @IsNotEmpty()
    firstName: string;

    @ApiProperty({ example: 'محمدی' })
    @IsNotEmpty()
    lastName: string;

    @ApiProperty({ example: '09123456789' })
    @IsNotEmpty()
    phone: string;

    @ApiProperty({ example: 1 })
    @IsNotEmpty()
    productId: number;

    @ApiProperty({ example: 2 })
    @IsNotEmpty()
    quantity: number;

    @ApiPropertyOptional({ example: 'SUMMER20', description: 'کد تخفیف (اختیاری)' })
    @IsOptional()
    @IsString()
    discountCode?: string | null;
}
