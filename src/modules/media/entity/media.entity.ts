import { Product } from "src/modules/product/entities/product.entity";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('medias')
export class Media {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(() => Product, (product) => product.media, { nullable: true, onDelete: 'SET NULL' })
    product?: Product | null;

    @Column({ nullable: true })
    productId: number;

    @Column()
    url: string;

    @Column()
    type: string;

    @CreateDateColumn()
    createdAt: Date;

    @Column({ nullable: true })
    displayOrder?: number;
}