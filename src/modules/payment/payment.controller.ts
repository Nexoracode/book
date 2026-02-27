import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { PaymentPayDto } from './dto/payment-pay.dto';
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) { }

  @Post('pay')
  paymentRequest(@Body() dto: PaymentPayDto) {
    return this.paymentService.paymentRequest(dto);
  }

  @Post('verify')
  verifyRequest(@Query('Authority') authority: string, @Query('orderId') orderId: string) {
    return this.paymentService.verifyRequest(authority, +orderId);
  }

  @Post('without')
  async paymentWithout(@Query('orderId') orderid: string) {
    return this.paymentService.withoutPayment(+orderid);
  }

  @Post('excel')
  @UseInterceptors(FileInterceptor('file', { dest: './uploads' }))
  async uploadAndImport(@UploadedFile() file: Express.Multer.File, @Body() dto: { productId: number }) {
    if (!file?.path) throw new Error('فایل به درستی آپلود نشد');
    return this.paymentService.importFromExcel(file.path, dto.productId)
  }
}
