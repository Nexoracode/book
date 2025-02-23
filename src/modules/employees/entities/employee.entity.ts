import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export enum UserRole {
    USER = 'User',
    ADMIN = 'Admin',
}

@Entity()
export class Employees {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'first_name', type: 'varchar', length: 200 })
    firstName: string

    @Column({ name: 'last_name', type: 'varchar', length: 200 })
    lastName: string;

    @Column({ type: 'varchar', length: 11 })
    phone: string;

    @Column({ select: false, nullable: true })
    password?: string;

    @Column({ select: false, type: 'enum', enum: UserRole, default: UserRole.USER })
    role: UserRole;

    @Column({ select: false, nullable: true })
    api_token?: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
