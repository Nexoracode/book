import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { DiscountType } from '../entities/discount.entity';

export class CreateDiscountDto {
  @ApiProperty({ example: 'SUMMER20', description: 'کد تخفیف یکتا' })
  @IsNotEmpty()
  @IsString()
  code: string;

  @ApiProperty({ enum: DiscountType, example: DiscountType.PERCENTAGE, description: 'نوع تخفیف: درصدی یا مبلغ ثابت' })
  @IsEnum(DiscountType)
  type: DiscountType;

  @ApiProperty({ example: 20, description: 'مقدار تخفیف (درصد یا مبلغ)' })
  @IsNumber()
  @Min(1)
  value: number;

  @ApiPropertyOptional({ example: 100, description: 'حداکثر تعداد استفاده (خالی = نامحدود)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUses?: number;

  @ApiPropertyOptional({ example: '2025-12-31T23:59:59Z', description: 'تاریخ انقضا (خالی = بدون انقضا)' })
  @IsOptional()
  expiresAt?: Date;
}
