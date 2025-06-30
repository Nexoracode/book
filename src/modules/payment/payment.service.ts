import { Injectable } from '@nestjs/common';
import * as ZarinpalCheckout from 'zarinpal-checkout';
import { OrderService } from '../order/order.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Invoice } from '../invoice/entities/invoice.entity';
import { DataSource, Repository } from 'typeorm';
import { Order, OrderStatus } from '../order/entities/order.entity';
import { ProductService } from '../product/product.service';
import { SmsService } from '../sms/sms.service';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { runInTransaction } from 'src/common/helpers/transaction';
import { Product } from '../product/entities/product.entity';

@Injectable()
export class PaymentService {
  private zarinpal: ZarinpalCheckout.ZarinPalInstance

  constructor(
    private orderService: OrderService,
    private productService: ProductService,
    private smsService: SmsService,
    private readonly httpService: HttpService,
    @InjectRepository(Invoice)
    private invoiceRepo: Repository<Invoice>,
    private readonly dataSource: DataSource,
  ) {
    this.zarinpal = ZarinpalCheckout.create(`${process.env.ZARINPAL_MERCHANT_ID}`, true);
  }

  async callExternalApi(order: Order) {
    const url = 'https://api.roohbakhshac.ir/api/site/kole/user/register';
    try {
      const response = await lastValueFrom(this.httpService.post(url, {
        address: order.address.street,
        city: order.address.city,
        state: order.address.province,
        postal: order.address.postalCode,
        phone: order.user.phone,
        fullname: order.user.firstName + ' ' + order.user.lastName,
        paid: true,
      }))
      console.log('External API response:', response.status);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }


  async addToInvoice(orderId: number, cardPan: string, transactionId: number, paymentMethod: string) {
    const order = await this.orderService.findOne(orderId);
    const product = await this.productService.finOne(order.product.id);
    const amount = (+order.totalAmount + +product.postage);
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
    const product = await this.productService.finOne(order.product.id);
    const amount = (+order.totalAmount + +product.postage);
    console.log(amount, typeof (amount));
    const response = await this.zarinpal.PaymentRequest({
      Amount: amount,
      CallbackURL: callbackUrl,
      Description: `خرید کتاب ${product.name}`
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
    return runInTransaction(this.dataSource, async (manager) => {
      const order = await this.orderService.findOne(orderId);
      const product = await this.productService.finOne(order.product.id);
      const amount = (+order.totalAmount + +product.postage);
      try {
        const response = await this.zarinpal.PaymentVerification({
          Amount: amount,
          Authority: authority,
        })
        if (response.status === 100 || response.status === 101) {
          const cardPan = response['cardPan'];
          const createInvoice = manager.create(Invoice, {
            order,
            cardPan,
            amount,
            transactionId: response.refId,
            paymentMethod: 'Zarinpal'
          })
          await manager.save(Invoice, createInvoice);
          const updateOrder = manager.merge(Order, order, {
            id: order.id,
            status: OrderStatus.COMPLETED
          })
          await manager.save(Order, updateOrder);
          const stock = product.stock - order.quantity;
          manager.merge(Product, product, { stock })
          await manager.save(Product, product);
          const { firstName, lastName, phone } = order.user;
          const fullName = `${firstName} ${lastName}`;
          this.smsService.sendSms(phone, fullName, response.refId.toString())
          const { user, address, ...result } = updateOrder;
          if (order.product.id === 2) {
            await this.callExternalApi(order);
          }
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
        const updateOrder = manager.merge(Order, order, {
          id: order.id,
          status: OrderStatus.FAIL_VERIFY
        })
        await manager.save(Order, updateOrder);
        const stock = product.stock + order.quantity;
        manager.merge(Product, product, { stock })
        const savedProduct = await manager.save(Product, product);
        const { user, address, ...result } = updateOrder;
        return {
          data: {
            date: new Date().toISOString(),
            order: {
              ...result,
              product: savedProduct,
            },
          },
        }
      }
    })
  }

  async withoutPayment(orderId: number) {
    return runInTransaction(this.dataSource, async (manager) => {
      const order = await this.orderService.findOne(orderId);
      const product = await this.productService.finOne(order.product.id);
      const amount = (+order.totalAmount + +product.postage);
      const createInvoice = manager.create(Invoice, {
        order,
        amount: amount,
        cardPan: 'مدیریت',
        transactionId: 123,
        paymentMethod: 'خرید حضوری'
      })
      await manager.save(Invoice, createInvoice);
      const updateOrder = manager.merge(Order, order, {
        id: order.id,
        status: OrderStatus.COMPLETED
      })
      await manager.save(Order, updateOrder);
      const stock = product.stock - order.quantity;
      manager.merge(Product, product, { stock })
      await manager.save(Product, product);
      const { firstName, lastName, phone } = order.user;
      const fullName = `${firstName} ${lastName}`;
      this.smsService.sendSms(phone, fullName, orderId.toString())
      const { user, address, ...result } = updateOrder;
      if (order.product.id === 2) {
        await this.callExternalApi(order);
      }
      return {
        message: 'خرید با موفقیت انجام شد',
        statusCode: 200,
        data: {
          date: new Date().toISOString(),
          order: result,
        },
      }
    })
  }
}
