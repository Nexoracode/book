import { Injectable, InternalServerErrorException, NotFoundException, ConflictException } from '@nestjs/common';
import Zarinpal from 'zarinpal-node-sdk'
import { OrderService } from '../order/order.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Invoice } from '../invoice/entities/invoice.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Order, OrderStatus } from '../order/entities/order.entity';
import { ProductService } from '../product/product.service';
import { SmsService } from '../sms/sms.service';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { runInTransaction } from 'src/common/helpers/transaction'; // Assuming this helper is correctly implemented
import { Product } from '../product/entities/product.entity';
import * as xlsx from 'xlsx';
import { SuspiciousTransaction } from '../suspicios/entities/supicious.entity';
import { PaymentPayDto } from './dto/payment-pay.dto';
import { Discount } from '../discount/entities/discount.entity';

// Define constants for Zarinpal statuses and magic numbers
enum ZarinpalStatus {
  SUCCESS = 100,
  SUCCESS_SETTLED = 101, // Payment was successful and settled
  // General errors for request and verification
  INVALID_AMOUNT = -9, // مبلغ نامعتبر است
  INVALID_MERCHANT_CODE = -10, // مرچنت کد نامعتبر است
  INVALID_IP = -11, // IP نامعتبر است
  INVALID_CALLBACK_URL = -12, // CallbackURL نامعتبر است
  TRANSACTION_NOT_FOUND = -21, // تراکنش یافت نشد
  PAYMENT_FAILED = -22, // پرداخت ناموفق
  USER_CANCELED = -20, // پرداخت لغو شده توسط کاربر
  DUPLICATE_VERIFICATION = -16, // دو بار تایید شده است
  AMOUNT_MISMATCH = -17, // مبلغ پرداخت شده با مبلغ درخواستی یکسان نیست
  INTERNAL_ERROR = -18, // خطای داخلی سیستم (General internal error)
  PAYMENT_FAILED_GENERIC = -51, // پرداخت ناموفق
  SESSION_MISMATCH = -53, // سشن با مرچنت کد همخوانی ندارد.
  // Add more specific Zarinpal status codes from the provided list as needed
}

// Helper function to get Zarinpal error messages
function getZarinpalErrorMessage(statusCode: number): string {
  switch (statusCode) {
    case ZarinpalStatus.INVALID_AMOUNT: return 'مبلغ نامعتبر است.';
    case ZarinpalStatus.INVALID_MERCHANT_CODE: return 'مرچنت کد پذیرنده صحیح نیست.';
    case ZarinpalStatus.INVALID_IP: return 'IP و یا مرچنت کد پذیرنده صحیح نیست.';
    case ZarinpalStatus.INVALID_CALLBACK_URL: return 'CallbackURL نامعتبر است.';
    case ZarinpalStatus.TRANSACTION_NOT_FOUND: return 'تراکنش یافت نشد.';
    case ZarinpalStatus.PAYMENT_FAILED: return 'پرداخت ناموفق بود.';
    case ZarinpalStatus.USER_CANCELED: return 'پرداخت توسط کاربر لغو شد.';
    case ZarinpalStatus.DUPLICATE_VERIFICATION: return 'این تراکنش قبلاً تایید شده است.';
    case ZarinpalStatus.AMOUNT_MISMATCH: return 'مبلغ پرداخت شده با مبلغ درخواستی یکسان نیست.';
    case ZarinpalStatus.INTERNAL_ERROR: return 'خطای داخلی در سیستم زرین‌پال رخ داده است.';
    case ZarinpalStatus.PAYMENT_FAILED_GENERIC: return 'پرداخت ناموفق.';
    case ZarinpalStatus.SESSION_MISMATCH: return 'سشن با مرچنت کد همخوانی ندارد.';
    default: return `خطای نامشخص از درگاه پرداخت. کد خطا: ${statusCode}`;
  }
}

const SPECIAL_PRODUCT_ID_FOR_EXTERNAL_API = 2;
const EXTERNAL_API_URL = process.env.EXTERNAL_API_URL || 'https://api.roohbakhshac.ir/api/site/kole/user/register';

const zarinpal = new Zarinpal({
  merchantId: process.env.ZARINPAL_MERCHANT_ID,
  sandbox: process.env.ZARINPAL_SANDBOX == "true",
})

@Injectable()
export class PaymentService {
  constructor(
    private orderService: OrderService,
    private productService: ProductService,
    private smsService: SmsService,
    private readonly httpService: HttpService,
    @InjectRepository(Invoice)
    private invoiceRepo: Repository<Invoice>,
    private readonly dataSource: DataSource,
  ) { }

  private async logSuspiciousTransaction(manager: EntityManager, context: {
    orderId: number,
    transactionId?: string,
    amount?: number,
    paymentMethod?: string,
    statusMessage?: string,
    rawResponse?: any,
    errorCode?: string,
    authority: string;
  }) {
    const record = new SuspiciousTransaction();
    record.order = { id: context.orderId } as Order;
    record.transactionId = context.transactionId || 'UNKNOWN';
    record.amount = context.amount || 0;
    record.paymentMethod = context.paymentMethod || 'UNKNOWN';
    record.statusMessage = context.statusMessage || 'UNKNOWN';
    record.rawResponse = context.rawResponse || null;
    record.errorCode = context.errorCode || 'UNKNOWN';
    record.authority = context.authority;
    await manager.save(SuspiciousTransaction, record);
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

    if (updatedStock < 0) {
      throw new InternalServerErrorException(`Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${quantity}`);
    }

    manager.merge(Product, product, { stock: updatedStock });
    await manager.save(Product, product);
  }

  private async callExternalApi(order: Order) {
    try {
      const response = await lastValueFrom(this.httpService.post(EXTERNAL_API_URL, {
        address: order.address?.street,
        city: order.address?.city,
        state: order.address?.province,
        postal: order.address?.postalCode,
        phone: order.user?.phone,
        fullname: `${order.user?.firstName || ''} ${order.user?.lastName || ''}`,
        paid: true,
      }));
      console.log('External API response status:', response.status);
      return response.data;
    } catch (error) {
      console.error(`Error calling external API for order ${order.id}:`, error.message, error.response?.data);
      // Do not re-throw here, as per user requirement to return data even on error.
      // This external API call is not critical for the main payment flow's success/failure.
    }
  }

  async paymentRequest(dto: PaymentPayDto) {
    const order = await this.orderService.findOne(dto.orderId);
    if (!order) {
      return {
        message: 'سفارش یافت نشد.',
        statusCode: 404,
        error: 'ORDER_NOT_FOUND',
        data: { date: new Date().toISOString(), order: null }, // Return null for order if not found
      };
    }

    const product = await this.productService.findOne(order.product.id);
    if (!product) {
      return {
        message: 'محصول مرتبط با سفارش یافت نشد.',
        statusCode: 404,
        error: 'PRODUCT_NOT_FOUND',
        data: { date: new Date().toISOString(), order: order },
      };
    }

    const amount = parseFloat(order.totalAmount.toString()) + parseFloat(product.postage.toString());
    const finalAmount = parseInt(amount + '0');

    try {
      const response = await zarinpal.payments.create({
        amount: finalAmount,
        callback_url: dto.callbackUrl,
        description: `خرید کتاب ${product.name}`,
        mobile: order.user?.phone,
      });

      if (response.data.code === ZarinpalStatus.SUCCESS) {
        await this.orderService.updateStatus(order.id, OrderStatus.PROCESSING);
        return {
          message: 'لینک درگاه پرداخت، با موفقیت ایجاد شد',
          statusCode: 200,
          data: {
            status: 100,
            authority: response.data.authority,
            url: `${process.env.ZARINPAL_PAYMENT_URL}/${response.data.authority}`
          }, // Zarinpal response data
        };
      } else {
        // Zarinpal returned an error status for the request itself
        await this.orderService.updateStatus(order.id, OrderStatus.FAIL_PAYMENT);
        const errorMessage = getZarinpalErrorMessage(response.status);
        return {
          message: `خطا در درخواست پرداخت: ${errorMessage}`,
          statusCode: 400, // Bad Request or specific Zarinpal error
          error: `ZARINPAL_REQUEST_FAILED_${response.status}`,
          data: {
            date: new Date().toISOString(),
            order: { ...order, status: OrderStatus.FAIL_PAYMENT }, // Return updated order status
            zarinpalResponse: response, // Include Zarinpal's raw response for debugging
          },
        };
      }
    } catch (e: any) {
      console.error(`Error during Zarinpal PaymentRequest for order ${dto.orderId}:`);

      let zarinpalErrorStatus: number | null = null;

      // Attempt 1: Check if the error object itself has a 'status' property
      if (typeof e.status === 'number' && e.status < 0) {
        zarinpalErrorStatus = e.status;
      }
      // Attempt 2: Check if it's an Axios-like error with a response status
      else if (e.response && typeof e.response.status === 'number' && e.response.status < 0) {
        zarinpalErrorStatus = e.response.status;
      }
      // Attempt 3: Check for the specific 'errors.code' structure
      else if (e.errors && typeof e.errors.code === 'number' && e.errors.code < 0) {
        zarinpalErrorStatus = e.errors.code;
      }
      // Attempt 4: Try to parse from the error message string (e.g., "-22: Payment Failed")
      else if (typeof e.message === 'string') {
        const match = e.message.match(/^(-?\d+):/);
        if (match && match[1]) {
          const parsedStatus = parseInt(match[1], 10);
          if (parsedStatus < 0) { // Only consider negative status codes as Zarinpal errors
            zarinpalErrorStatus = parsedStatus;
          }
        }
      }

      if (typeof zarinpalErrorStatus === 'number' && zarinpalErrorStatus < 0) {
        // It's a Zarinpal-specific error that was thrown
        await this.orderService.updateStatus(order.id, OrderStatus.FAIL_PAYMENT);
        const errorMessage = getZarinpalErrorMessage(zarinpalErrorStatus);
        return {
          message: `خطا در درخواست پرداخت: ${errorMessage}`,
          statusCode: 400, // Bad Request for Zarinpal-specific errors
          error: `ZARINPAL_REQUEST_FAILED_THROWN_${zarinpalErrorStatus}`, // Indicate it was a thrown error
          data: {
            date: new Date().toISOString(),
            order: { ...order, status: OrderStatus.FAIL_PAYMENT },
            zarinpalError: e, // Include the raw error object for debugging
          },
        };
      } else {
        // This is a truly unexpected error (network, server configuration, etc.)
        await this.orderService.updateStatus(order.id, OrderStatus.FAIL_PAYMENT);
        return {
          message: 'خطا در ارتباط با درگاه پرداخت. لطفاً دوباره تلاش کنید.',
          statusCode: 500,
          error: 'PAYMENT_GATEWAY_COMMUNICATION_ERROR',
          data: {
            date: new Date().toISOString(),
            order: { ...order, status: OrderStatus.FAIL_PAYMENT },
            detailedError: e.message || 'Unknown error',
          },
        };
      }
    }
  }

  private async _completePaymentAndOrder(
    manager: EntityManager,
    order: Order,
    product: Product,
    amount: number,
    paymentDetails: { cardPan: string; transactionId: number; paymentMethod: string },
  ) {
    const existingInvoice = await manager.findOne(Invoice, { where: { order: { id: order.id } } });
    if (existingInvoice) {
      return { message: 'فاکتور قبلاً ثبت شده است.', statusCode: 409, data: existingInvoice };
    }

    const updateOrder = manager.merge(Order, order, { id: order.id, status: OrderStatus.COMPLETED });
    await manager.save(Order, updateOrder);

    const verifiedOrder = await manager.findOne(Order, { where: { id: order.id }, relations: ['product', 'user'] });
    if (verifiedOrder?.status !== OrderStatus.COMPLETED) {
      throw new InternalServerErrorException('ثبت وضعیت سفارش به Completed ناموفق بود.');
    }

    await this.updateProductStock(manager, product, order.quantity, 'decrease');

    const invoice = manager.create(Invoice, {
      order,
      cardPan: paymentDetails.cardPan,
      amount,
      transactionId: paymentDetails.transactionId,
      paymentMethod: paymentDetails.paymentMethod,
    });
    await manager.save(Invoice, invoice);

    if (order.product.id === SPECIAL_PRODUCT_ID_FOR_EXTERNAL_API) {
      await this.callExternalApi(order);
    }

    try {
      const { firstName, lastName, phone } = order.user;
      this.smsService.sendSms(phone, `${firstName} ${lastName}`, paymentDetails.transactionId.toString());
    } catch (e) {
      console.error(`Failed to send SMS for order ${order.id}:`, e.message);
    }

    if (order.coupon) {
      const discount = await manager.findOne(Discount, { where: { code: order.coupon } });
      if (discount) {
        discount.usedCount = (discount.usedCount || 0) + 1;
        await manager.save(Discount, discount);
      }
    }

    return {
      message: 'پرداخت با موفقیت انجام شد',
      statusCode: 200,
      data: {
        date: new Date(),
        payment: paymentDetails,
        order: verifiedOrder,
      },
    };
  }

  async verifyRequest(authority: string, orderId: number) {
    return runInTransaction(this.dataSource, async (manager) => {
      const order = await this.orderService.findOne(orderId);
      if (!order || order.status === OrderStatus.COMPLETED) {
        const existingInvoice = await manager.findOne(Invoice, { where: { order: { id: order?.id } } });
        return { message: 'سفارش شما قبلا تکمیل شده است.', statusCode: 409, data: existingInvoice || order };
      }

      const product = await this.productService.findOne(order.product.id);
      const amount = parseFloat(order.totalAmount.toString()) + parseFloat(product.postage.toString());
      const finalAmount = parseInt(amount + '0');
      try {
        const response = await zarinpal.verifications.verify({ amount: finalAmount, authority: authority });
        if ([ZarinpalStatus.SUCCESS, ZarinpalStatus.SUCCESS_SETTLED].includes(response.data.code)) {
          const duplicateTransaction = await manager.findOne(Invoice, { where: { transactionId: Number(response.data.ref_id) } });
          if (duplicateTransaction) {
            return { message: 'تراکنش تکراری است.', statusCode: 409, data: duplicateTransaction };
          }

          return await this._completePaymentAndOrder(manager, order, product, amount, {
            cardPan: response.data.card_pan,
            transactionId: Number(response.data.ref_id),
            paymentMethod: 'Zarinpal',
          });
        }
        const failedOrder = manager.merge(Order, order, { id: order.id, status: OrderStatus.FAIL_VERIFY });
        await manager.save(Order, failedOrder);
        await this.updateProductStock(manager, product, order.quantity, 'increase');

        return { message: 'پرداخت ناموفق بود.', statusCode: 400, data: { order: failedOrder } };
      }
      catch (e: any) {
        await this.logSuspiciousTransaction(manager, {
          orderId: order.id,
          transactionId: e?.response?.data.ref_id?.toString() || null,
          amount,
          paymentMethod: 'Zarinpal',
          statusMessage: e?.message || 'Error during verification',
          rawResponse: e?.response.error || e?.message || null,
          errorCode: 'ZARINPAL_THROWN_ERR',
          authority,
        });
      }

      const failedOrder = manager.merge(Order, order, { id: order.id, status: OrderStatus.FAIL_VERIFY });
      await manager.save(Order, failedOrder);
      await this.updateProductStock(manager, product, order.quantity, 'increase');

      return { message: 'خطا در تایید پرداخت.', statusCode: 500, data: { order: failedOrder } };
    })
  }

  async withoutPayment(orderId: number) {
    return runInTransaction(this.dataSource, async (manager) => {
      const order = await this.orderService.findOne(orderId);
      const product = await this.productService.findOne(order.product.id);
      const amount = parseFloat(order.totalAmount.toString()) + parseFloat(product.postage.toString());

      const transactionId = order.id * 1000 + (Date.now() % 1000);

      if (order.status === OrderStatus.COMPLETED) {
        const existingInvoice = await manager.findOne(Invoice, { where: { order: { id: order.id } } });
        return { message: 'سفارش قبلاً تکمیل شده است.', statusCode: 409, data: existingInvoice };
      }

      return await this._completePaymentAndOrder(manager, order, product, amount, {
        cardPan: 'مدیریت',
        transactionId,
        paymentMethod: 'خرید حضوری',
      });
    });
  }


  async importFromExcel(filePath: string, productId: number) {
    return runInTransaction(this.dataSource, async (manager) => {
      const product = await manager.findOne(Product, { where: { id: productId } })
      if (!product) throw new NotFoundException('product not found');
      console.log(product);
      const workbook = xlsx.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = xlsx.utils.sheet_to_json(sheet);
      type ExcelRow = {
        firstName: string;
        lastName: string;
        phone: string;
        state: string;
        city: string;
        fullAddress: string;
        postalCode: string;
        plaque: string;
        [key: string]: any;
      };
      for (const row of rows as ExcelRow[]) {
        const { firstName, lastName, phone, state, city, fullAddress, postalCode, plaque } = row;
        const order = await this.orderService.addToOrder({
          productId: product.id,
          firstName,
          lastName,
          phone,
          quantity: 1,
          province: state,
          city,
          street: fullAddress,
          plaque,
          postalCode
        })
        await this.withoutPayment(order.id);
      }
      return {
        statusCode: 200,
        message: 'تمام اطلاعات با موفقیت ثبت شد',
      }
    })
  }
}
