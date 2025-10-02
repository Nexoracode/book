import { ArrayMaxSize, IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
export class CreateProductDto {

    @ApiProperty({ example: 'Book Title' })
    @IsNotEmpty()
    name: string;

    @ApiProperty({ example: 'This is a book about...' })
    @IsNotEmpty()
    description: string;

    @ApiProperty({ example: 280000 })
    @IsNotEmpty()
    @IsNumber()
    price: number;

    @ApiProperty({ example: null, description: 'Discount as a decimal (e.g., 0.1 for 10%)', required: false })
    @IsNotEmpty()
    @IsNumber()
    @IsOptional()
    discount?: number;

    @ApiProperty({ example: 100 })
    @IsNotEmpty()
    @IsNumber()
    stock: number;

    @ApiProperty({ example: 5.00 })
    @IsNotEmpty()
    @IsNumber()
    postage: number;

    @ApiProperty({ example: 'Additional description or details about the book.', required: false })
    @IsNotEmpty()
    @IsString()
    description2: string;

    @ApiProperty({ example: 'Fiction' })
    @IsNotEmpty()
    @IsString()
    author?: string;

    @ApiProperty({ example: 'Fiction' })
    @IsOptional()
    @IsNotEmpty()
    @IsString()
    publisher?: string;

    @ApiProperty({ example: 'Fiction' })
    @IsNotEmpty()
    @IsString()
    genre?: string;

    @ApiProperty({ example: 'Adult' })
    @IsNotEmpty()
    @IsString()
    ageGroup?: string;

    @ApiProperty({ example: 300 })
    @IsNotEmpty()
    @IsNumber()
    pages?: number;

    @ApiProperty({ example: 'Hardcover' })
    @IsNotEmpty()
    @IsString()
    template?: string;

    @ApiProperty({ example: 'Hardcover' })
    @IsNotEmpty()
    @IsString()
    coverType?: string;

    @ApiProperty({ example: 1.5, description: 'Weight in kilograms' })
    @IsNotEmpty()
    @IsNumber()
    weight?: number;

    @ApiProperty({ example: 9783161484100 })
    @IsNotEmpty()
    @IsNumber()
    isbn?: number;

    @ApiProperty({ example: 'http://example.com/video', required: false })
    @IsString()
    @IsOptional()
    urlVideo?: string;

    @ApiProperty({ example: 'http://example.com/thumbnail.jpg', required: false })
    @IsString()
    @IsOptional()
    thumbnail?: string;

    @ApiProperty({ example: [1, 2, 3], description: 'Array of media IDs', required: false })
    @IsOptional()
    @IsArray()
    @ArrayMaxSize(20)
    @IsInt({ each: true })
    mediaIds?: number[];
}
