import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Product {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 100 })
    name: string;

    @Column({ type: 'text' })
    description: string;

    @Column()
    stock: number;

    @Column('decimal')
    price: number;

    @Column('decimal', { nullable: true })
    discount?: number;
}
