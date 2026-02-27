import { IsInt, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class PaymentPayDto {

    @ApiProperty({ example: 1, description: 'order ID' })
    @IsInt()
    orderId: number;

    @ApiProperty({ example: "https://shop.roohbakhshac.ir/verify?orderId=822", description: 'callback url' })
    @IsString()
    callbackUrl: string;

}