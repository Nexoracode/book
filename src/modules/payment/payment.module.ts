import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { OrderService } from '../order/order.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderModule } from '../order/order.module';
import { Invoice } from '../invoice/entities/invoice.entity';
import { ProductModule } from '../product/product.module';
import { SmsModule } from '../sms/sms.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,
    ProductModule,
    OrderModule,
    SmsModule,
    TypeOrmModule.forFeature([Invoice]),
  ],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule { }
