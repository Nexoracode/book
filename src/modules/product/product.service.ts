import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>
  ) { }

  async create(createProductDto: CreateProductDto) {
    const product = await this.productRepo.create(createProductDto);
    await this.productRepo.save(product);
    return {
      message: 'added product successfully',
      statusCode: 201,
      data: product,
    }
  }

  async find() {
    const product = await this.productRepo.find();
    return {
      message: 'get all products successfully',
      statusCode: 200,
      data: product,
    };
  }

  async finOne(id: number) {
    const product = await this.productRepo.findOne({ where: { id } })
    if (!product) {
      throw new NotFoundException('product not found');
    }
    return product;
  }

  async updateStock(id: number, stock: number) {
    let product = await this.finOne(id);
    product.stock = stock;
    await this.productRepo.save(product);
    return {
      message: 'update stock in product successfully',
      statusCode: 201,
      data: product,
    }
  }

  async update(id: number, dto: UpdateProductDto) {
    let product = await this.finOne(id);
    product.name = dto.name,
      product.discount = dto.discount,
      product.price = dto.price,
      product.stock = dto.stock,
      product.description = dto.description
    await this.productRepo.save(product);
    return {
      message: 'update stock in product successfully',
      statusCode: 201,
      data: product,
    }
  }

}
