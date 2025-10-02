import { IsInt, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class PaymentPayDto {

    @ApiProperty({ example: 1, description: 'order ID' })
    @IsInt()
    orderId: number;

    @ApiProperty({ example: "http://localhost:3000?orderId=822", description: 'callback url' })
    @IsString()
    callBack: string;

}