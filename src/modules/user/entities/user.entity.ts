import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

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

    @Column({ type: 'varchar', length: 100 })
    province: string;

    @Column({ type: 'varchar', length: 100 })
    city: string;

    @Column({ type: 'text' })
    street: string;

    @Column({ type: 'varchar', length: 10, nullable: true })
    plaque: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    postalCode: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
