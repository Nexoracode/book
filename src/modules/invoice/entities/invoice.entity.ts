import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Order } from '../../order/entities/order.entity';

@Entity()
export class Invoice {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Order, { onDelete: 'CASCADE' })
    order: Order;

    @Column()
    transactionId: number;

    @Column({ type: 'decimal' })
    amount: number;

    @Column()
    paymentMethod: string;

    @CreateDateColumn()
    createdAt: Date;
}