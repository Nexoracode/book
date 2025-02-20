import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>
  ) { }

  async create(createUserDto: CreateUserDto) {
    const user = await this.userRepo.findOne({ where: { phone: createUserDto.phone } });
    if (user) {
      throw new BadRequestException('user exists');
    }
    const newUser = this.userRepo.create(createUserDto);
    await this.userRepo.save(newUser);
    return {
      message: 'added user successfully',
      statusCode: 201,
      data: newUser,
    }
  }

  findAll() {
    return `This action returns all user`;
  }

  findOne(id: number) {
    return `This action find a #${id} user`;
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
