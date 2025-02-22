import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppConfigModule } from './config/config.module';
import { ProductModule } from './modules/product/product.module';
import { OrderModule } from './modules/order/order.module';
import { PaymentModule } from './modules/payment/payment.module';
import { UserModule } from './modules/user/user.module';
import { InvoiceModule } from './modules/invoice/invoice.module';
import { SmsModule } from './modules/sms/sms.module';
import { AuthModule } from './modules/auth/auth.module';
import { dataSourceOption } from './database/data-source';

ConfigModule.forRoot();
@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forRoot(dataSourceOption),
    ProductModule,
    OrderModule,
    PaymentModule,
    UserModule,
    InvoiceModule,
    SmsModule,
    AuthModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
