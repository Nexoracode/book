import { PartialType } from "@nestjs/mapped-types";
import { IsNotEmpty, IsNumber } from "class-validator";
import { CreateProductDto } from "./create-product.dto";

export class UpdateProductDto extends PartialType(CreateProductDto) { }