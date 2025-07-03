import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFiles, ParseIntPipe } from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { MediaService } from '../media/media.service';

@Controller('product')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly mediaService: MediaService,
  ) { }

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 10))
  uploadImages(@UploadedFiles() files: Express.Multer.File[]) {
    return this.mediaService.uploadFile(files);
  }

  @Get()
  productFind() {
    return this.productService.find();
  }

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productService.findOne(+id);
  }

  @Patch('stock/:id')
  updateStock(@Param('id') id: string, @Body('stock') stock: string) {
    return this.productService.updateStock(+id, +stock);
  }

  @Patch(':id')
  updateProduct(@Param('id', ParseIntPipe) id: number, @Body() data: UpdateProductDto) {
    return this.productService.update(id, data);
  }

  @Delete(':id')
  removeProduct(@Param('id', ParseIntPipe) id: number) {
    return this.productService.remove(id);
  }
}
