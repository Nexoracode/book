import { Injectable } from '@nestjs/common';
import * as ZarinpalCheckout from 'zarinpal-checkout';
import { OrderService } from '../order/order.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Invoice } from '../invoice/entities/invoice.entity';
import { Repository } from 'typeorm';
import { OrderStatus } from '../order/entities/order.entity';

@Injectable()
export class PaymentService {
  private zarinpal: ZarinpalCheckout.ZarinPalInstance

  constructor(
    private orderService: OrderService,
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>
  ) {
    this.zarinpal = ZarinpalCheckout.create(`${process.env.ZARINPAL}`, true);
  }


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

  async paymentRequest(orderId: number, callbackUrl: string) {
    const order = await this.orderService.findOne(orderId);
    const response = await this.zarinpal.PaymentRequest({
      Amount: order.totalAmount,
      CallbackURL: callbackUrl,
      Description: 'خرید کتاب نماز باحال'
    })
    if (response.status === 100) {
      await this.orderService.updateStatus(order.id, OrderStatus.PROCESSING);
      return {
        message: 'لینک درگاه پرداخت، با موفقیت ایجاد شد',
        statusCode: 200,
        data: response,
      }
    } else {
      await this.orderService.updateStatus(order.id, OrderStatus.FAIL_PAYMENT);
      throw new Error('payment error')
    }
  }

  async verifyRequest(authority: string, orderId: number) {
    const order = await this.orderService.findOne(orderId);
    const response = await this.zarinpal.PaymentVerification({
      Amount: order.totalAmount,
      Authority: authority,
    })
    if (response.status === 100) {
      await this.orderService.updateStatus(order.id, OrderStatus.COMPLETED);
      const invoice = this.invoiceRepo.create({
        amount: order.totalAmount,
        transactionId: response.refId,
        paymentMethod: 'Zarinpal',
        order,
      })
      await this.invoiceRepo.save(invoice)
      return {
        message: 'پرداخت با موفیت انجام شد',
        statusCode: 200,
        data: response,
      }
    } else {
      await this.orderService.updateStatus(order.id, OrderStatus.FAIL_VERIFY);
      throw new Error('verify payment error');
    }
  }
}
