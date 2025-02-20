import { Injectable } from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { Repository } from 'typeorm';
import { OrderService } from '../order/order.service';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
    private orderService: OrderService
  ) { }

  async addToInvoice(orderId: number, transactionId: number, paymentMethod: string) {
    const order = await this.orderService.findOne(orderId);
    const invoice = this.invoiceRepo.create({
      amount: order.totalAmount,
      transactionId,
      paymentMethod,
      order,
    })
    await this.invoiceRepo.save(invoice);
    return invoice;
  }
}
