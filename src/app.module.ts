import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { ProductModule } from './modules/product/product.module';
import { OrderModule } from './modules/order/order.module';
import { PaymentModule } from './modules/payment/payment.module';
import { UserModule } from './modules/user/user.module';
import { InvoiceModule } from './modules/invoice/invoice.module';
import { dataSourceOption } from 'db/data-source';
import { SmsModule } from './modules/sms/sms.module';
import { AuthModule } from './modules/auth/auth.module';

ConfigModule.forRoot();
@Module({
  imports: [
    AppConfigModule,
    TypeOrmModule.forRoot(dataSourceOption),
    DatabaseModule,
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
console.log(process.env.NODE_ENV)
