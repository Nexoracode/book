import { IPaymentSuccess } from "../interfaces/payment.interface";

export class PaymentMapper {
    static toResponse(payment: IPaymentSuccess): IPaymentSuccess {
        return {
            message: payment.message,
            statusCode: payment.statusCode,
            data: {
                date: payment.data.date,
                order: payment.data.order || null,
                invoice: payment.data.invoice || null,
            }
        }
    }
}