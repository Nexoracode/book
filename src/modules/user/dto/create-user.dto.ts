import { isNotEmpty, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
export class CreateUserDto {


    @ApiProperty({ example: 'John' })
    @IsNotEmpty()
    firstName: string;

    @ApiProperty({ example: 'Doe' })
    @IsNotEmpty()
    lastName: string

    @ApiProperty({ example: 'securePassword123' })
    @IsNotEmpty()
    phone: string;
}
