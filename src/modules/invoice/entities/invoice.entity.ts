import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import { Order } from '../../order/entities/order.entity';

@Entity()
export class Invoice {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Order, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @Column('bigint', { name: 'transaction_id' })
    transactionId: number;

    @Column({ type: 'decimal' })
    amount: number;

    @Column({ type: 'varchar', length: 100, name: 'card_pan' })
    cardPan: string;

    @Column({ name: 'payment_method' })
    paymentMethod: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}