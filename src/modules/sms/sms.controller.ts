import { Body, Controller, Post } from '@nestjs/common';
import { SmsService } from './sms.service';

@Controller('sms')
export class SmsController {
  constructor(private readonly smsService: SmsService) { }
  @Post('send')
  sendSms(@Body('phone') phone: string, @Body('name') name: string, @Body('refId') refId: string) {
    return this.smsService.sendSms(phone, name, refId);
  }
}
