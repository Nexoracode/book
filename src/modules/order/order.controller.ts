import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { Paginate, PaginateQuery } from 'nestjs-paginate';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @Post('add')
  async addToOrder(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.addToOrder(createOrderDto);
  }


  @Get('all')
  orderFindAllPage() {
    return this.orderService.finalAll()
  }

  @Get('report')
  orderReports() {
    return this.orderService.orderReports();
  }

  @Get()
  orderFindAll(@Paginate() query: PaginateQuery) {
    return this.orderService.findAllPaginate(query);
  }


  @Get(':id')
  async orderById(@Param('id') id: string) {
    const order = await this.orderService.findOne(+id)
    return {
      message: 'get order successfully',
      statusCode: 200,
      data: order
    }
  }
}
