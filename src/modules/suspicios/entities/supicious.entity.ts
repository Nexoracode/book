import { Order } from 'src/modules/order/entities/order.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';

@Entity()
export class SuspiciousTransaction {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Order, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @Column({ nullable: true })
    transactionId: string;

    @Column({ type: 'decimal', nullable: true })
    amount: number;

    @Column({ type: 'varchar', length: 255, nullable: true })
    paymentMethod: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    statusMessage: string;

    @Column({ type: 'json', nullable: true })
    rawResponse: any;

    @Column({ type: 'varchar', length: 100, nullable: true })
    errorCode: string;

    @Column({ type: 'varchar' })
    authority: string;

    @CreateDateColumn()
    createdAt: Date;
}
