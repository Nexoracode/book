import { Injectable } from '@nestjs/common';
import * as ZarinpalCheckout from 'zarinpal-checkout';
import { OrderService } from '../order/order.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Invoice } from '../invoice/entities/invoice.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
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
    this.zarinpal = ZarinpalCheckout.create(`${process.env.ZARINPAL_MERCHANT_ID}`, false);
  }

  private async updateProductStock(
    manager: EntityManager,
    product: Product,
    quantity: number,
    operation: 'increase' | 'decrease',
  ) {
    const updatedStock = operation === 'decrease'
      ? product.stock - quantity
      : product.stock + quantity;
    manager.merge(Product, product, { stock: updatedStock });
    await manager.save(Product, product);
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

      const existingInvoice = await manager.findOne(Invoice, { where: { order: { id: order.id } } });
      if (existingInvoice) {
        return {
          message: 'فاکتور قبلاً ثبت شده است',
          statusCode: 409,
          data: existingInvoice,
        };
      }

      try {
        const response = await this.zarinpal.PaymentVerification({
          Amount: amount,
          Authority: authority,
        })
        const duplicateTransaction = await manager.findOne(Invoice, { where: { transactionId: response.refId } });

        if (duplicateTransaction) {
          return {
            message: 'تراکنش تکراری است',
            statusCode: 409,
            data: duplicateTransaction,
          };
        }
        if (response.status === 100 || response.status === 101) {
          const updateOrder = manager.merge(Order, order, {
            id: order.id,
            status: OrderStatus.COMPLETED
          })
          await manager.save(Order, updateOrder);
          await this.updateProductStock(manager, product, order.quantity, 'decrease');
          const { firstName, lastName, phone } = order.user;
          const fullName = `${firstName} ${lastName}`;
          const createInvoice = manager.create(Invoice, {
            order,
            cardPan: response['cardPan'],
            amount,
            transactionId: response.refId,
            paymentMethod: 'Zarinpal'
          })
          await manager.save(Invoice, createInvoice);
          this.smsService.sendSms(phone, fullName, response.refId.toString())
          const finalOrder = await manager.findOne(Order, {
            where: { id: order.id },
            relations: ['product', 'invoice', 'user', 'address'],
          });
          if (!finalOrder) throw new Error('سفارش یافت نشد');
          const { user, address, ...result } = finalOrder;
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
        const failedOrder = manager.merge(Order, order, { id: order.id, status: OrderStatus.FAIL_VERIFY });
        await manager.save(Order, failedOrder);
        await this.updateProductStock(manager, product, order.quantity, 'increase');
        const { address, user, ...result } = failedOrder;
        return {
          data: {
            date: new Date().toISOString(),
            order: result,
          },
        };
      };
    })
  }

  async withoutPayment(orderId: number) {
    return runInTransaction(this.dataSource, async (manager) => {
      const order = await this.orderService.findOne(orderId);
      const product = await this.productService.finOne(order.product.id);
      const amount = (+order.totalAmount + +product.postage);
      const existingInvoice = await manager.findOne(Invoice, { where: { order: { id: order.id } } });
      if (existingInvoice) {
        return {
          message: 'فاکتور قبلاً ثبت شده است',
          statusCode: 409,
          data: existingInvoice,
        };
      }

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
      const createInvoice = manager.create(Invoice, {
        order: { id: orderId },
        amount: amount,
        cardPan: 'مدیریت',
        transactionId: 123,
        paymentMethod: 'خرید حضوری'
      })
      await manager.save(Invoice, createInvoice);
      this.smsService.sendSms(phone, fullName, orderId.toString())
      const finalOrder = await manager.findOne(Order, {
        where: { id: order.id },
        relations: ['product', 'invoice'],
      });
      if (!finalOrder) throw new Error('سفارش یافت نشد');
      if (order.product.id === 2) {
        await this.callExternalApi(order);
      }
      return {
        message: 'خرید با موفقیت انجام شد',
        statusCode: 200,
        data: {
          date: new Date().toISOString(),
          order: finalOrder,
        },
      }
    })
  }
}
