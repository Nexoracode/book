import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) { }

  @Post('pay')
  paymentRequest(@Body('orderId') id: string, @Body('callback') callback: string) {
    return this.paymentService.paymentRequest(+id, callback);
  }

  @Post('verify')
  verifyRequest(@Query('Authority') authority: string, @Query('orderId') orderId: string) {
    return this.paymentService.verifyRequest(authority, +orderId);
  }
}
