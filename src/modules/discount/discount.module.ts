import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Discount } from './entities/discount.entity';
import { DiscountService } from './discount.service';
import { DiscountController } from './discount.controller';
import { Order } from '../order/entities/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Discount, Order])],
  controllers: [DiscountController],
  providers: [DiscountService],
  exports: [DiscountService], // export می‌کنیم تا OrderModule بتونه استفاده کنه
})
export class DiscountModule { }
