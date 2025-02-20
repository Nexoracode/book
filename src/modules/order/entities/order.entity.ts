import { Product } from "src/modules/product/entities/product.entity";
import { User } from "src/modules/user/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Address } from "./address.entity";

export enum OrderStatus {
    PENDING = 'Pending',
    CANCELED = 'Canceled'
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

    @ManyToOne(() => Product,)
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @Column('decimal')
    totalAmount: number;

    @Column({ default: 1 })
    quantity: number;

    @ManyToOne(() => Address)
    @JoinColumn({ name: 'address_id' })
    address: Address

    @CreateDateColumn({ name: 'crated_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
