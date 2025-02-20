import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) { }

  @Post('pay')
  paymentRequest(@Query('orderId') id: string) {
    const callbackUrl = `http://localhost:3000/payment/verify?orderId=${id}`;
    return this.paymentService.paymentRequest(+id, callbackUrl);
  }

  @Post('verify')
  verifyRequest(@Query('Authority') authority: string, @Query('orderId') orderId: string) {
    return this.paymentService.verifyRequest(authority, +orderId);
  }
}
