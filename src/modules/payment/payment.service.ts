import { Injectable, InternalServerErrorException, NotFoundException, ConflictException } from '@nestjs/common';
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
import { runInTransaction } from 'src/common/helpers/transaction'; // Assuming this helper is correctly implemented
import { Product } from '../product/entities/product.entity';

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
    case -1: return 'اطلاعات ارسال شده ناقص است.';
    case -2: return 'IP و یا مرچنت کد پذیرنده صحیح نیست.';
    case -3: return 'با توجه به محدودیت های شاپرک امکان پرداخت با رقم درخواستی میسر نیست.';
    case -4: return 'مرچنت کد نامعتبر است.';
    case -9: return 'خطای اعتبار سنجی.';
    case -10: return 'مبلغ درخواستی نامعتبر است.';
    case -11: return 'شماره کارت نامعتبر است.';
    case -12: return 'شماره حساب نامعتبر است.';
    case -15: return 'تراکنش قبلا برگشت خورده است.';
    case -19: return 'پرداخت ناموفق.';
    case -22: return 'تراکنش ناموفق.';
    case -23: return 'تراکنش نامعتبر است.';
    case -24: return 'تراکنش یافت نشد.';
    case -25: return 'مبلغ پرداخت شده کمتر از حداقل مجاز است.';
    case -26: return 'مبلغ پرداخت شده بیشتر از حداکثر مجاز است.';
    case -27: return 'تراکنش منقضی شده است.';
    case -28: return 'تراکنش قبلاً انجام شده است.';
    case -29: return 'تراکنش تایید نشده است.';
    case -30: return 'تراکنش برگشت داده شده است.';
    case -31: return 'تراکنش لغو شده است.';
    // ... you can add more cases based on the full Zarinpal error list
    default: return `خطای نامشخص از درگاه پرداخت. کد خطا: ${statusCode}`;
  }
}

const SPECIAL_PRODUCT_ID_FOR_EXTERNAL_API = 2;
const EXTERNAL_API_URL = process.env.EXTERNAL_API_URL || 'https://api.roohbakhshac.ir/api/site/kole/user/register';

@Injectable()
export class PaymentService {
  private zarinpal: ZarinpalCheckout.ZarinPalInstance;

  constructor(
    private orderService: OrderService,
    private productService: ProductService,
    private smsService: SmsService,
    private readonly httpService: HttpService,
    @InjectRepository(Invoice)
    private invoiceRepo: Repository<Invoice>,
    private readonly dataSource: DataSource,
  ) {
    const merchantId = process.env.ZARINPAL_MERCHANT_ID;
    if (!merchantId) {
      throw new Error('ZARINPAL_MERCHANT_ID is not defined in environment variables.');
    }
    this.zarinpal = ZarinpalCheckout.create(merchantId, false);
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

  async paymentRequest(orderId: number, callbackUrl: string) {
    const order = await this.orderService.findOne(orderId);
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

    try {
      const response = await this.zarinpal.PaymentRequest({
        Amount: amount,
        CallbackURL: callbackUrl,
        Description: `خرید کتاب ${product.name}`,
      });

      if (response.status === ZarinpalStatus.SUCCESS) {
        await this.orderService.updateStatus(order.id, OrderStatus.PROCESSING);
        return {
          message: 'لینک درگاه پرداخت، با موفقیت ایجاد شد',
          statusCode: 200,
          data: response, // Zarinpal response data
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
      console.error(`Error during Zarinpal PaymentRequest for order ${orderId}:`, e);

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
    // This check is important to prevent creating duplicate invoices if _completePaymentAndOrder is called directly
    const existingInvoice = await manager.findOne(Invoice, { where: { order: { id: order.id } } });
    if (existingInvoice) {
      return {
        message: 'فاکتور قبلاً ثبت شده است.',
        statusCode: 409,
        error: 'INVOICE_ALREADY_EXISTS',
        data: { date: new Date().toISOString(), invoice: existingInvoice, order: order },
      };
    }

    const updateOrder = manager.merge(Order, order, {
      id: order.id,
      status: OrderStatus.COMPLETED,
    });
    await manager.save(Order, updateOrder);

    await this.updateProductStock(manager, product, order.quantity, 'decrease');

    const { firstName, lastName, phone } = order.user;
    const fullName = `${firstName} ${lastName}`;
    const createInvoice = manager.create(Invoice, {
      order,
      cardPan: paymentDetails.cardPan,
      amount,
      transactionId: paymentDetails.transactionId,
      paymentMethod: paymentDetails.paymentMethod,
    });
    await manager.save(Invoice, createInvoice);

    try {
      this.smsService.sendSms(phone, fullName, paymentDetails.transactionId.toString());
    } catch (smsError) {
      console.error(`Failed to send SMS for order ${order.id}:`, smsError.message);
      // Not re-throwing, just logging. SMS failure shouldn't fail the entire transaction.
    }

    const finalOrder = await manager.findOne(Order, {
      where: { id: order.id },
      relations: ['product', 'invoice', 'user', 'address'],
    });
    if (!finalOrder) {
      return {
        message: 'خطای داخلی: سفارش پس از تکمیل یافت نشد.',
        statusCode: 500,
        error: 'FINAL_ORDER_NOT_FOUND',
        data: { date: new Date().toISOString(), order: { ...order, status: OrderStatus.COMPLETED } },
      };
    }

    if (order.product.id === SPECIAL_PRODUCT_ID_FOR_EXTERNAL_API) {
      await this.callExternalApi(order);
    }

    const { user, address, ...result } = finalOrder;
    return {
      message: 'پرداخت با موفقیت انجام شد',
      statusCode: 200,
      data: {
        date: new Date().toISOString(),
        payment: paymentDetails,
        order: result,
      },
    };
  }

  async verifyRequest(authority: string, orderId: number) {
    return runInTransaction(this.dataSource, async (manager) => {
      const order = await this.orderService.findOne(orderId);
      if (!order) {
        return {
          message: 'سفارش یافت نشد.',
          statusCode: 404,
          error: 'ORDER_NOT_FOUND',
          data: { date: new Date().toISOString(), order: null },
        };
      }

      // --- CRITICAL FIX: Early exit if order is already COMPLETED ---
      if (order.status === OrderStatus.COMPLETED) {
        // Attempt to find the existing invoice to return it
        const existingInvoice = await manager.findOne(Invoice, { where: { order: { id: order.id } } });
        return {
          message: 'این سفارش قبلاً با موفقیت تکمیل شده است.',
          statusCode: 200, // Success, as the order is already in the desired state
          error: 'ORDER_ALREADY_COMPLETED',
          data: {
            date: new Date().toISOString(),
            order: order, // Return the existing completed order
            invoice: existingInvoice || null, // Include existing invoice if found
            // No Zarinpal payment details here as we didn't re-verify
          },
        };
      }
      // --- END CRITICAL FIX ---


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

      try {
        const response = await this.zarinpal.PaymentVerification({
          Amount: amount,
          Authority: authority,
        });

        // --- Handle Zarinpal's own status codes FIRST ---
        if (response.status === ZarinpalStatus.SUCCESS || response.status === ZarinpalStatus.SUCCESS_SETTLED) {
          // Payment was successful. Proceed with completion logic.
          const zarinpalRefId = Number(response.refId); // refId should be present for success

          // Check for duplicate transaction ID (important!)
          const duplicateTransaction = await manager.findOne(Invoice, { where: { transactionId: zarinpalRefId } });
          if (duplicateTransaction) {
            // This is a duplicate verification for a payment that was already processed and invoiced.
            // This scenario should ideally be caught by the `order.status === OrderStatus.COMPLETED` check above,
            // but this provides an additional layer of safety for invoice duplication.
            return {
              message: 'تراکنش تکراری است. این پرداخت قبلاً ثبت شده است.',
              statusCode: 409,
              error: 'DUPLICATE_TRANSACTION_ID',
              data: { date: new Date().toISOString(), invoice: duplicateTransaction, order: order },
            };
          }

          // Proceed to complete the order
          return await this._completePaymentAndOrder(manager, order, product, amount, {
            cardPan: response['cardPan'],
            transactionId: zarinpalRefId,
            paymentMethod: 'Zarinpal',
          });

        } else {
          // Zarinpal returned a non-success status. This is a Zarinpal business error.
          const failedOrder = manager.merge(Order, order, { id: order.id, status: OrderStatus.FAIL_VERIFY });
          await manager.save(Order, failedOrder);
          await this.updateProductStock(manager, product, order.quantity, 'increase'); // Revert stock

          const errorMessage = getZarinpalErrorMessage(response.status);
          const { user, address, ...result } = failedOrder;
          return {
            message: `تایید پرداخت ناموفق: ${errorMessage}`,
            statusCode: 400, // Bad Request, as it's a Zarinpal-specific issue
            error: `ZARINPAL_VERIFICATION_FAILED_${response.status}`,
            data: {
              date: new Date().toISOString(),
              order: result,
              zarinpalResponse: response, // Include Zarinpal's raw response
            },
          };
        }
      } catch (e: any) { // Use 'any' to safely access error properties
        console.error(`Error during Zarinpal PaymentVerification for order ${orderId}:`, e);

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

        // --- Ensure order status is updated to FAIL_VERIFY and stock is reverted if not already ---
        const currentOrder = await manager.findOne(Order, { where: { id: order.id } });
        if (currentOrder && currentOrder.status !== OrderStatus.FAIL_VERIFY && currentOrder.status !== OrderStatus.COMPLETED) {
          const failedOrder = manager.merge(Order, currentOrder, { id: order.id, status: OrderStatus.FAIL_VERIFY });
          await manager.save(Order, failedOrder);
          await this.updateProductStock(manager, product, order.quantity, 'increase');
        }
        // --- END Ensure ---

        if (typeof zarinpalErrorStatus === 'number' && zarinpalErrorStatus < 0) {
          // It's a Zarinpal-specific error that was thrown
          const errorMessage = getZarinpalErrorMessage(zarinpalErrorStatus);
          const { user, address, ...result } = (currentOrder || order); // Use currentOrder if available
          return {
            message: `تایید پرداخت ناموفق: ${errorMessage}`,
            statusCode: 400, // Bad Request for Zarinpal-specific errors
            error: `ZARINPAL_VERIFICATION_FAILED_THROWN_${zarinpalErrorStatus}`, // Indicate it was a thrown error
            data: {
              date: new Date().toISOString(),
              order: result,
              zarinpalError: e, // Include the raw error object for debugging
            },
          };
        } else {
          // This is a truly unexpected error (network, database, etc.)
          const { user, address, ...result } = (currentOrder || order);
          return {
            message: 'خطای سیستمی در تایید پرداخت رخ داد. لطفاً با پشتیبانی تماس بگیرید.',
            statusCode: 500,
            error: 'INTERNAL_VERIFICATION_ERROR',
            data: {
              date: new Date().toISOString(),
              order: result,
              detailedError: e.message || 'Unknown error',
            },
          };
        }
      }
    });
  }

  async withoutPayment(orderId: number) {
    return runInTransaction(this.dataSource, async (manager) => {
      const order = await this.orderService.findOne(orderId);
      if (!order) {
        return {
          message: 'سفارش یافت نشد.',
          statusCode: 404,
          error: 'ORDER_NOT_FOUND',
          data: { date: new Date().toISOString(), order: null },
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

      // Generate a shorter, unique-enough numeric transaction ID for offline payments
      // Combines order.id with the last 3 digits of the current timestamp.
      // This reduces the length significantly while maintaining uniqueness for a given order ID.
      // Note: Ensure order.id is not excessively large to prevent overflow if the database field is small.
      const transactionId = order.id * 1000 + (Date.now() % 1000);

      // If the order was already completed, handle gracefully
      if (order.status === OrderStatus.COMPLETED) {
        const existingInvoice = await manager.findOne(Invoice, { where: { order: { id: order.id } } });
        return {
          message: 'این سفارش قبلاً با موفقیت تکمیل شده است.',
          statusCode: 200, // Or 409 Conflict
          error: 'ORDER_ALREADY_COMPLETED',
          data: {
            date: new Date().toISOString(),
            order: order,
            invoice: existingInvoice // Return existing invoice if found
          },
        };
      }

      return await this._completePaymentAndOrder(manager, order, product, amount, {
        cardPan: 'مدیریت',
        transactionId: transactionId,
        paymentMethod: 'خرید حضوری',
      });
    });
  }
}
