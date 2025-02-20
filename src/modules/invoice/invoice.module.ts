import { Module } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [OrderModule, TypeOrmModule.forFeature([Invoice])],
  controllers: [InvoiceController],
  providers: [InvoiceService],
})
export class InvoiceModule { }
