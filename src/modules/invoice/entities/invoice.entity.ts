import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn, Unique, OneToOne } from 'typeorm';
import { Order } from '../../order/entities/order.entity';

@Entity()
@Unique(['order'])
export class Invoice {
    @PrimaryGeneratedColumn()
    id: number;

    @OneToOne(() => Order, { onDelete: 'CASCADE', nullable: false })
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