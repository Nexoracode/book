import { Product } from "src/modules/product/entities/product.entity";
import { User } from "src/modules/user/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Address } from "./address.entity";
import { Invoice } from "src/modules/invoice/entities/invoice.entity";

export enum OrderStatus {
    PENDING = 'Pending',
    PROCESSING = 'Processing',
    COMPLETED = 'Completed',
    FAIL_PAYMENT = 'FailPayment',
    FAIL_VERIFY = 'FailVerify',
    CANCELED = 'Canceled',
    ADMIN_PAYMENT = 'adminPayment'
}

@Entity()
export class Order {
    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => User, (user) => user.orders, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
    status: OrderStatus

    @OneToOne(() => Invoice, (invoice) => invoice.order)
    invoice: Invoice

    @ManyToOne(() => Product,)
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Column('decimal', { name: 'total_amount' })
    totalAmount: number;

    @Column({ default: 1 })
    quantity: number;

    @Column({ type: 'varchar', name: 'coupon', nullable: true })
    coupon?: string | null

    @ManyToOne(() => Address)
    @JoinColumn({ name: 'address_id' })
    address: Address

    @CreateDateColumn({ name: 'crated_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
