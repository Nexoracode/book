import { Injectable } from '@nestjs/common';
import * as ZarinpalCheckout from 'zarinpal-checkout';
import { OrderService } from '../order/order.service';

@Injectable()
export class PaymentService {
  private zarinpal: ZarinpalCheckout.ZarinPalInstance

  constructor(private orderService: OrderService) {
    this.zarinpal = ZarinpalCheckout.create(`${process.env.ZARINPAL}`, true);
  }

  async paymentRequest(orderId: number, callbackUrl: string) {
    const order = await this.orderService.findOne(orderId);
    const response = await this.zarinpal.PaymentRequest({
      Amount: order.totalAmount,
      CallbackURL: callbackUrl,
      Description: 'خرید کتاب نماز باحال'
    })
    if (response.status === 100) {
      return {
        message: 'لینک درگاه پرداخت، با موفقیت ایجاد شد',
        statusCode: 200,
        data: response,
      }
    } else {
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
      return {
        message: 'پرداخت با موفیت انجام شد',
        statusCode: 200,
        data: response,
      }
    } else {
      throw new Error('verify payment error');
    }
  }
}
