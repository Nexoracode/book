import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Product } from '../product/entities/product.entity';
import { User } from '../user/entities/user.entity';
import { Address } from './entities/address.entity';
import { FilterOperator, FilterSuffix, Paginate, PaginateQuery, paginate, Paginated } from 'nestjs-paginate'
import { timestamp } from 'rxjs';
import { DiscountService } from '../discount/discount.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Address) private addressRepo: Repository<Address>,
    @Optional() private discountService: DiscountService,
  ) { }

  async updateStatus(orderId: number, status: OrderStatus) {
    const order = await this.findOne(orderId);
    order.status = status;
    await this.orderRepo.save(order);
    return order;
  }


  async findOne(orderId: number) {
    const order = await this.orderRepo.findOne({ where: { id: orderId }, relations: ['user', 'address', 'product', 'invoice'] });
    if (!order) {
      throw new NotFoundException('order not found');
    }
    return order;
  }

  async finalAll() {
    return await this.orderRepo.find({ relations: ['user', 'address', 'invoice', 'product'] })
  }

  async findAllPaginate(query: PaginateQuery): Promise<Paginated<Order>> {
    return paginate(query, this.orderRepo, {
      relations: ['invoice', 'product', 'user', 'address'],
      select: ['user.id', 'user.lastName', 'user.firstName', 'user.phone'],
      sortableColumns: ['id', 'createdAt'],
      defaultSortBy: [['createdAt', 'DESC']],
      searchableColumns: ['invoice.amount', 'user.phone', 'user.(firstName', 'user.lastName)', 'id'],
      filterableColumns: {
        status: [FilterOperator.EQ],
        createdAt: [FilterOperator.GTE, FilterOperator.LTE],
        product_id: [FilterOperator.EQ],
      }
    });
  }

  async orderReports(productId?: number) {
    const today = new Date().toISOString().slice(0, 10);

    const query = this.orderRepo
      .createQueryBuilder('order')
      .select([
        `SUM(CASE WHEN order.status = :completed OR order.status = :paymentAdmin THEN 1 ELSE 0 END) AS totalCompletedOrders`,
        `SUM(CASE WHEN DATE(order.createdAt) = :today AND (order.status = :completed OR order.status = :paymentAdmin) THEN 1 ELSE 0 END) AS totalOrdersToday`,
        `SUM(CASE WHEN order.status = :completed OR order.status = :paymentAdmin THEN order.totalAmount ELSE 0 END) AS totalAmount`,
        `SUM(CASE WHEN (order.status = :completed OR order.status = :paymentAdmin) AND DATE(order.createdAt) = :today THEN order.totalAmount ELSE 0 END) AS totalAmountToday`,
        `SUM(CASE WHEN (order.status = :completed OR order.status = :paymentAdmin) AND DATE(order.createdAt) = :today THEN order.quantity ELSE 0 END) AS totalQuantityToday`,
        `SUM(CASE WHEN order.status = :completed OR order.status = :paymentAdmin THEN order.quantity ELSE 0 END) AS totalBooksSold`
      ])
      .setParameters({
        today,
        completed: OrderStatus.COMPLETED,
        paymentAdmin: OrderStatus.ADMIN_PAYMENT,
      });

    if (productId) {
      query.andWhere('order.product_id = :productId', { productId });
    }

    const result = await query.getRawOne();
    return result;
  }

  async addToOrder(dto: CreateOrderDto) {
    const product = await this.productRepo.findOne({ where: { id: dto.productId } });
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    let user = await this.userRepo.findOne({ where: { phone: dto.phone } });
    if (!user) {
      user = this.userRepo.create({
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
      })
      await this.userRepo.save(user);
    }

    let amount = product.discount === null ? (product.price * dto.quantity) : (product.discount! * dto.quantity);

    var order;

    // اعمال کد تخفیف در صورت ارسال
    if (dto.discountCode && this.discountService) {
      const result = await this.discountService.applyDiscount(dto.discountCode, amount, user.phone);
      console.log(result);
      if (result) {
        amount = result.discountedAmount;
        order = this.orderRepo.create({
          user,
          product,
          totalAmount: amount,
          quantity: dto.quantity,
          status: OrderStatus.PENDING,
          coupon: dto.discountCode,
        });
      } else {
        order = this.orderRepo.create({
          user,
          product,
          totalAmount: amount,
          quantity: dto.quantity,
          status: OrderStatus.PENDING,
        });
      }
    }

    const address = this.addressRepo.create(dto);
    await this.addressRepo.save(address);
    order.address = address;
    await this.orderRepo.save(order);
    return order;
  }
}
