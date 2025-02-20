import { Order } from "src/modules/order/entities/order.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 200 })
    firstName: string

    @Column({ type: 'varchar', length: 200 })
    lastName: string;

    @Column({ type: 'varchar', length: 11 })
    phone: string;

    @Column({ nullable: true })
    password?: string;

    @OneToMany(() => Order, (order) => order.user)
    orders: Order[]

    @CreateDateColumn({ name: 'crated_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
