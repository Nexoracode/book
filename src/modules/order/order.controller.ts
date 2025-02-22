import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Paginate, PaginateQuery } from 'nestjs-paginate';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) { }

  @Post('add')
  async addToOrder(@Body() createOrderDto: CreateOrderDto) {
    return this.orderService.addToOrder(createOrderDto);
  }

  @Get()
  orderFindAll(@Paginate() query: PaginateQuery) {
    return this.orderService.findAllPaginate(query);
  }

  @Get('all')
  orderFindAllPage() {
    return this.orderService.finalAll()
  }
}
