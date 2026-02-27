import { Module } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { Product } from '../product/entities/product.entity';
import { Address } from './entities/address.entity';
import { User } from '../user/entities/user.entity';
import { DiscountModule } from '../discount/discount.module';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Product, User, Address]), DiscountModule],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService]
})
export class OrderModule { }
