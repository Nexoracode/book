import { Injectable, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Address) private addressRepo: Repository<Address>
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
        createdAt: [FilterOperator.GTE, FilterOperator.LTE]
      }
    });
  }

  async orderReports() {
    const orders = await this.orderRepo.find({ relations: ['user', 'address', 'invoice', 'product'] })
    const today = new Date().toISOString().slice(0, 10);

    const quantityToday = await this.orderRepo
      .createQueryBuilder('order')
      .where('DATE(order.createdAt) = :date', { date: today })
      .getCount();

    const orderQuantity = await this.orderRepo
      .createQueryBuilder('order')
      .where('status = :status', { status: OrderStatus.COMPLETED })
      .getMany()

    const totalAmount = await this.orderRepo
      .createQueryBuilder('order')
      .leftJoin('order.invoice', 'invoice')
      .select(['order.id', 'invoice.amount'])
      .where('invoice.amount IS NOT NULL')
      .getCount()

    console.log('quantity for today : ', quantityToday);
    console.log('all quantity orders : ', orderQuantity.length);
    console.log('total amount : ', totalAmount);

    return orders;
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

    const order = this.orderRepo.create({
      user,
      product,
      totalAmount: product.price * dto.quantity,
      quantity: dto.quantity,
      status: OrderStatus.PENDING,
    });

    const address = this.addressRepo.create(dto);
    await this.addressRepo.save(address);
    order.address = address;
    await this.orderRepo.save(order);
    return order;
  }
}
