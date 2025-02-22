import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Order } from "./order.entity";

@Entity()
export class Address {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 100 })
    province: string;

    @Column({ type: 'varchar', length: 100 })
    city: string;

    @Column({ type: 'text' })
    street: string;

    @Column({ type: 'varchar', length: 10, nullable: true })
    plaque: string;

    @Column({ name: 'postal_code', type: 'varchar', length: 20, nullable: true })
    postalCode: string;

    @OneToMany(() => Order, (order) => order.address, { cascade: true })
    orders: Order[]
}