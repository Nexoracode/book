import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum DiscountType {
  PERCENTAGE = 'percentage', // درصدی
  FIXED = 'fixed',           // مبلغ ثابت
}

@Entity()
export class Discount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string;

  @Column({ type: 'enum', enum: DiscountType, default: DiscountType.PERCENTAGE })
  type: DiscountType;

  @Column('decimal', { precision: 10, scale: 2 })
  value: number; // اگر درصدی باشه: عدد ۱ تا ۱۰۰ | اگر ثابت باشه: مبلغ به تومان

  @Column({ name: 'max_uses', nullable: true, type: 'int', default: null })
  maxUses: number | null; // null یعنی نامحدود

  @Column({ name: 'used_count', default: 0 })
  usedCount: number;

  @Column({ name: 'expires_at', nullable: true, type: 'timestamp', default: null })
  expiresAt: Date | null; // null یعنی بدون تاریخ انقضا

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
