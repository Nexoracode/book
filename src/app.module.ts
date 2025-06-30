import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AppConfigModule } from './config/config.module';
import { ProductModule } from './modules/product/product.module';
import { OrderModule } from './modules/order/order.module';
import { PaymentModule } from './modules/payment/payment.module';
import { UserModule } from './modules/user/user.module';
import { InvoiceModule } from './modules/invoice/invoice.module';
import { SmsModule } from './modules/sms/sms.module';
import { AuthModule } from './modules/auth/auth.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { MediaModule } from './modules/media/media.module';

ConfigModule.forRoot();
@Module({
  imports: [
    AppConfigModule,
    ProductModule,
    OrderModule,
    PaymentModule,
    UserModule,
    InvoiceModule,
    SmsModule,
    AuthModule,
    EmployeesModule,
    MediaModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
