import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class ApplyDiscount {
    @ApiProperty({ description: 'کد تخفیف', example: 'SAVE20' })
    @IsNotEmpty()
    @IsString()
    code: string;

    @ApiProperty({ description: 'phone' })
    @IsNotEmpty()
    @IsString()
    phone: string;
}