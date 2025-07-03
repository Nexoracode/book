import { BadRequestException, Injectable, NotFoundException, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { DataSource, In, Repository } from 'typeorm';
import { runInTransaction } from 'src/common/helpers/transaction';
import { Media } from '../media/entity/media.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    private readonly dataSource: DataSource,
  ) { }

  async create(data: CreateProductDto) {
    return runInTransaction(this.dataSource, async (manager) => {
      const product = await manager.findOne(Product, { where: { name: data.name } })
      if (product) throw new BadRequestException('این محصول از قبل ثبت شده است');
      const newProduct = manager.create(Product, data);
      const saved = await manager.save(Product, newProduct);
      if (data.mediaIds && data.mediaIds.length !== 0) {
        await manager.update(Media, { id: In(data.mediaIds) }, { product: saved });
      }
      return {
        message: 'محصول با موفقیت افزوده شد',
        statusCode: 200,
        data: saved,
      }
    })
  }

  async find() {
    const products = await this.productRepo.find({ relations: ['media'] });
    return {
      message: 'get all products successfully',
      statusCode: 200,
      data: products,
    };
  }

  async findOne(id: number) {
    const product = await this.productRepo.findOne({ where: { id }, relations: ['media'] })
    if (!product) {
      throw new NotFoundException('product not found');
    }
    return product;
  }

  async updateStock(id: number, stock: number) {
    let product = await this.findOne(id);
    product.stock = stock;
    await this.productRepo.save(product);
    return {
      message: 'update stock in product successfully',
      statusCode: 201,
      data: product,
    }
  }

  async update(id: number, dto: UpdateProductDto) {
    return runInTransaction(this.dataSource, async (manager) => {
      const product = await this.findOne(id);
      if (!product) throw new NotFoundException('محصول مورد نظر یافت نشد.');

      const duplicate = await this.productRepo.findOne({ where: { name: dto.name } });
      if (duplicate && duplicate.id !== id)
        throw new BadRequestException('این محصول از قبل ثبت شده است');

      const updatedProduct = manager.merge(Product, product, dto);
      const savedProduct = await manager.save(Product, updatedProduct);
      await manager.update(Media, { product: { id } }, { product: null });
      let medias: Media[] = [];
      if (dto.mediaIds && dto.mediaIds.length > 0) {
        medias = await manager.find(Media, { where: { id: In(dto.mediaIds) } });
        for (const media of medias) {
          media.product = savedProduct;
          await manager.save(media);
        }
      }
      const resultProduct = await manager.findOne(Product, {
        where: { id },
        relations: ['media'],
      });

      return {
        message: 'محصول با موفقیت ویرایش شد',
        statusCode: 200,
        data: resultProduct,
      };
    });
  }


  async remove(id: number) {
    return runInTransaction(this.dataSource, async (manager) => {
      const product = await this.findOne(id);
      if (!product) throw new NotFoundException('محصول مورد نظر یافت نشد.');
      await manager.remove(Product, product);
      await manager.update(Media, { id: In(product.media.map((m) => m.id)) }, { product: null })
      return {
        message: 'حذف محصول با موفقیت انجام شد.',
        statusCode: 200,
        data: null,
      }
    })
  }

}
