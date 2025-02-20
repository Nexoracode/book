import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { Repository } from 'typeorm';
import { Product } from '../product/entities/product.entity';
import { User } from '../user/entities/user.entity';
import { Address } from './entities/address.entity';

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
  }


  async findOne(orderId: number) {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException();
    }
    return order;
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
