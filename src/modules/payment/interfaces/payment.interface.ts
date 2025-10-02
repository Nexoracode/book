import { Invoice } from "src/modules/invoice/entities/invoice.entity";
import { Order } from "src/modules/order/entities/order.entity";

export interface IPaymentSuccess {
    message: string;
    statusCode: number;
    data: {
        date: Date,
        invoice: Invoice | null,
        order: Order | null,
    }
}