import { Media } from "src/modules/media/entity/media.entity";
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

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

    @Column('text', { nullable: true })
    description2: string;

    @Column('decimal')
    postage: number;

    @Column('varchar', { nullable: true })
    author?: string;

    @Column('varchar', { nullable: true })
    publisher?: string;

    @Column('varchar', { nullable: true })
    ageGroup?: string;

    @Column('int', { nullable: true })
    pages?: number;

    @Column('varchar', { nullable: true })
    template?: string;

    @Column('varchar', { nullable: true })
    coverType?: string;

    @Column('int', { nullable: true })
    weight?: number;

    @Column('bigint', { nullable: true })
    isbn?: number;

    @OneToMany(() => Media, media => media.product, { cascade: true })
    media: Media[];
}
