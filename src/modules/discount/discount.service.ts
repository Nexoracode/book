import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Discount, DiscountType } from './entities/discount.entity';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { ApplyDiscount } from './dto/aply-discount.dto';
import { Order, OrderStatus } from '../order/entities/order.entity';

@Injectable()
export class DiscountService {
  constructor(
    @InjectRepository(Discount)
    private discountRepo: Repository<Discount>,
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
  ) { }

  async create(dto: CreateDiscountDto): Promise<Discount> {
    const existing = await this.discountRepo.findOne({ where: { code: dto.code } });
    if (existing) {
      throw new BadRequestException('این کد تخفیف قبلاً ثبت شده است.');
    }
    const discount = this.discountRepo.create(dto);
    return this.discountRepo.save(discount);
  }

  async findAll(): Promise<Discount[]> {
    return this.discountRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<Discount> {
    const discount = await this.discountRepo.findOne({ where: { id } });
    if (!discount) throw new NotFoundException('کد تخفیف یافت نشد.');
    return discount;
  }

  async update(id: number, dto: UpdateDiscountDto): Promise<Discount> {
    const discount = await this.findOne(id);

    // اگه code عوض شد، چک کن که تکراری نباشه
    if (dto.code && dto.code !== discount.code) {
      const existing = await this.discountRepo.findOne({ where: { code: dto.code } });
      if (existing) throw new BadRequestException('این کد تخفیف قبلاً ثبت شده است.');
    }

    Object.assign(discount, dto);
    return this.discountRepo.save(discount);
  }

  async toggleActive(id: number): Promise<Discount> {
    const discount = await this.findOne(id);
    discount.isActive = !discount.isActive;
    return this.discountRepo.save(discount);
  }

  async remove(id: number): Promise<{ message: string }> {
    const discount = await this.findOne(id);
    await this.discountRepo.remove(discount);
    return { message: 'کد تخفیف با موفقیت حذف شد.' };
  }

  /**
   * اعتبارسنجی کد تخفیف و برگرداندن مبلغ نهایی پس از اعمال تخفیف
   * این متد توسط OrderService صدا زده می‌شود
   */

  async apply(dto: ApplyDiscount) {
    const order = await this.orderRepo.findOne({ where: { user: { phone: dto.phone }, status: OrderStatus.COMPLETED, coupon: dto.code } })
    const discount = await this.discountRepo.findOne({ where: { code: dto.code } });

    if (order) {
      throw new BadRequestException('شما از این کدتخفیف استفاده کرده اید.');
    }

    if (!discount) {
      throw new BadRequestException('کد تخفیف نامعتبر است.');
    }

    if (!discount.isActive) {
      throw new BadRequestException('کد تخفیف غیرفعال است.');
    }

    if (discount.expiresAt && new Date() > new Date(discount.expiresAt)) {
      throw new BadRequestException('کد تخفیف منقضی شده است.');
    }

    if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
      throw new BadRequestException('ظرفیت استفاده از این کد تخفیف تمام شده است.');
    }

    return {
      message: 'کد تخفیف برای شما اعمال شد',
      data: {
        type: discount.type,
        value: Number(discount.value).toFixed(0),
      }
    }
  }

  async applyDiscount(code: string, originalAmount: number, phone: string) {
    const discount = await this.discountRepo.findOne({ where: { code } });

    const order = await this.orderRepo.findOne({ where: { user: { phone }, status: OrderStatus.COMPLETED, coupon: code } })
    if (order) {
      return false;
    }

    if (!discount) {
      return false;
    }

    if (!discount.isActive) {
      return false;
    }

    if (discount.expiresAt && new Date() > new Date(discount.expiresAt)) {
      return false;
    }

    if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
      return false;
    }

    let discountedAmount: number;

    if (discount.type === DiscountType.PERCENTAGE) {
      const discountAmount = (originalAmount * Number(discount.value)) / 100;
      discountedAmount = Math.max(0, originalAmount - discountAmount);
    } else {
      discountedAmount = Math.max(0, originalAmount - Number(discount.value));
    }

    return { discountedAmount, discount };
  }
}
