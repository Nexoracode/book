import { Injectable } from '@nestjs/common';
import * as ZarinpalCheckout from 'zarinpal-checkout';
import { OrderService } from '../order/order.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Invoice } from '../invoice/entities/invoice.entity';
import { Repository } from 'typeorm';
import { OrderStatus } from '../order/entities/order.entity';
import { ProductService } from '../product/product.service';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class PaymentService {
  private zarinpal: ZarinpalCheckout.ZarinPalInstance

  constructor(
    private orderService: OrderService,
    private productService: ProductService,
    private smsService: SmsService,
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>
  ) {
    this.zarinpal = ZarinpalCheckout.create(`${process.env.ZARINPAL_MERCHANT_ID}`, false);
  }


  async addToInvoice(orderId: number, cardPan: string, transactionId: number, paymentMethod: string) {
    const order = await this.orderService.findOne(orderId);
    const amount = (+order.totalAmount + 40_000);
    const invoice = this.invoiceRepo.create({
      amount: amount,
      transactionId,
      paymentMethod,
      cardPan,
      order,
    })
    await this.invoiceRepo.save(invoice);
    return invoice;
  }

  async paymentRequest(orderId: number, callbackUrl: string) {
    const order = await this.orderService.findOne(orderId);
    const amount = (+order.totalAmount + 40_000);
    const response = await this.zarinpal.PaymentRequest({
      Amount: amount,
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
    const amount = (+order.totalAmount + 40_000);
    const product = await this.productService.finOne(order.product.id);
    try {
      const response = await this.zarinpal.PaymentVerification({
        Amount: amount,
        Authority: authority,
      })
      if (response.status === 100 || response.status === 101) {
        const cardPan = response['cardPan'];
        await this.addToInvoice(order.id, cardPan, response.refId, 'Zarinpal')
        const updateOrder = await this.orderService.updateStatus(order.id, OrderStatus.COMPLETED);
        const stock = product.stock - order.quantity;
        await this.productService.updateStock(product.id, stock);
        const { firstName, lastName, phone } = order.user;
        const fullName = `${firstName} ${lastName}`;
        this.smsService.sendSms(phone, fullName, response.refId.toString())
        const { user, address, ...result } = updateOrder;
        return {
          message: 'پرداخت با موفیت انجام شد',
          statusCode: 200,
          data: {
            date: new Date().toISOString(),
            payment: response,
            order: result,
          },
        }
      }
    } catch (e) {
      console.log(e);
      const updateOrder = await this.orderService.updateStatus(order.id, OrderStatus.FAIL_VERIFY);
      const { user, address, ...result } = updateOrder;
      return {
        data: {
          date: new Date().toISOString(),
          order: result,
        },
      }
    }
  }
}
