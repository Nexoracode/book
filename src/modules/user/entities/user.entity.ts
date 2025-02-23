import { Order } from "src/modules/order/entities/order.entity";
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'first_name', type: 'varchar', length: 200 })
    firstName: string

    @Column({ name: 'last_name', type: 'varchar', length: 200 })
    lastName: string;

    @Column({ type: 'varchar', length: 11 })
    phone: string;

    @OneToMany(() => Order, (order) => order.user)
    orders: Order[]

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
