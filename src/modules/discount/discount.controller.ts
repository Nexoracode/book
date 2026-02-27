import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { DiscountService } from './discount.service';
import { CreateDiscountDto } from './dto/create-discount.dto';
import { UpdateDiscountDto } from './dto/update-discount.dto';
import { Discount } from './entities/discount.entity';
import { ApplyDiscount } from './dto/aply-discount.dto';

@ApiTags('Discount')
@Controller('discount')
export class DiscountController {
  constructor(private readonly discountService: DiscountService) { }

  // ─── CREATE ────────────────────────────────────────────────────────────────

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'ساخت کد تخفیف جدید',
    description: 'یک کد تخفیف جدید با نوع درصدی یا مبلغ ثابت ایجاد می‌کند.',
  })
  @ApiBody({ type: CreateDiscountDto })
  @ApiResponse({ status: 201, description: 'کد تخفیف با موفقیت ساخته شد.', type: Discount })
  @ApiResponse({ status: 400, description: 'کد تخفیف تکراری است یا داده‌ها نامعتبر هستند.' })
  create(@Body() dto: CreateDiscountDto) {
    return this.discountService.create(dto);
  }

  // ─── READ ALL ──────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({
    summary: 'لیست همه کدهای تخفیف',
    description: 'تمام کدهای تخفیف را به ترتیب جدیدترین برمی‌گرداند.',
  })
  @ApiResponse({ status: 200, description: 'لیست کدهای تخفیف.', type: [Discount] })
  findAll() {
    return this.discountService.findAll();
  }

  // ─── READ ONE ──────────────────────────────────────────────────────────────

  @Get(':id')
  @ApiOperation({
    summary: 'دریافت یک کد تخفیف',
    description: 'اطلاعات یک کد تخفیف را بر اساس ID برمی‌گرداند.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'شناسه کد تخفیف', example: 1 })
  @ApiResponse({ status: 200, description: 'کد تخفیف یافت شد.', type: Discount })
  @ApiResponse({ status: 404, description: 'کد تخفیف یافت نشد.' })
  findOne(@Param('id') id: string) {
    return this.discountService.findOne(+id);
  }

  @Post('apply')
  async applyDiscount(@Body() apply: ApplyDiscount) {
    return this.discountService.apply(apply);
  }

  // ─── UPDATE ────────────────────────────────────────────────────────────────

  @Patch(':id')
  @ApiOperation({
    summary: 'ویرایش کد تخفیف',
    description: 'فیلدهای ارسال شده را آپدیت می‌کند. فیلدهای ارسال نشده بدون تغییر باقی می‌مانند.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'شناسه کد تخفیف', example: 1 })
  @ApiBody({ type: UpdateDiscountDto })
  @ApiResponse({ status: 200, description: 'کد تخفیف با موفقیت ویرایش شد.', type: Discount })
  @ApiResponse({ status: 400, description: 'کد تخفیف تکراری است یا داده‌ها نامعتبر هستند.' })
  @ApiResponse({ status: 404, description: 'کد تخفیف یافت نشد.' })
  update(@Param('id') id: string, @Body() dto: UpdateDiscountDto) {
    return this.discountService.update(+id, dto);
  }

  // ─── TOGGLE ACTIVE ─────────────────────────────────────────────────────────

  @Patch(':id/toggle')
  @ApiOperation({
    summary: 'فعال / غیرفعال کردن کد تخفیف',
    description: 'وضعیت isActive یک کد تخفیف را toggle می‌کند.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'شناسه کد تخفیف', example: 1 })
  @ApiResponse({ status: 200, description: 'وضعیت کد تخفیف تغییر کرد.', type: Discount })
  @ApiResponse({ status: 404, description: 'کد تخفیف یافت نشد.' })
  toggleActive(@Param('id') id: string) {
    return this.discountService.toggleActive(+id);
  }

  // ─── DELETE ────────────────────────────────────────────────────────────────

  @Delete(':id')
  @ApiOperation({
    summary: 'حذف کد تخفیف',
    description: 'یک کد تخفیف را به صورت دائمی حذف می‌کند.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'شناسه کد تخفیف', example: 1 })
  @ApiResponse({ status: 200, description: 'کد تخفیف با موفقیت حذف شد.' })
  @ApiResponse({ status: 404, description: 'کد تخفیف یافت نشد.' })
  remove(@Param('id') id: string) {
    return this.discountService.remove(+id);
  }
}
