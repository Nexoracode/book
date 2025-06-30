import { ArrayMaxSize, IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CreateProductDto {
    @IsNotEmpty()
    name: string;

    @IsNotEmpty()
    description: string;

    @IsNotEmpty()
    @IsNumber()
    price: number;

    @IsNotEmpty()
    @IsNumber()
    @IsOptional()
    discount?: number;

    @IsNotEmpty()
    @IsNumber()
    stock: number;

    @IsNotEmpty()
    @IsNumber()
    postage: number;

    @IsNotEmpty()
    @IsString()
    description2: string;

    @IsNotEmpty()
    @IsString()
    author?: string;

    @IsNotEmpty()
    @IsString()
    publisher?: string;

    @IsNotEmpty()
    @IsString()
    ageGroup?: string;

    @IsNotEmpty()
    @IsNumber()
    pages?: number;

    @IsNotEmpty()
    @IsString()
    template?: string;

    @IsNotEmpty()
    @IsString()
    coverType?: string;

    @IsNotEmpty()
    @IsNumber()
    weight?: number;

    @IsNotEmpty()
    @IsNumber()
    isbn?: number;

    @IsString()
    @IsOptional()
    urlVideo?: string;

    @IsString()
    @IsOptional()
    thumbnail?: string;

    @IsOptional()
    @IsArray()
    @ArrayMaxSize(20)
    @IsInt({ each: true })
    mediaIds?: number[];
}
