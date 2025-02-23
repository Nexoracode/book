import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Employees } from './entities/employee.entity';
import { Repository } from 'typeorm';

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(Employees)
    private employeesRepo: Repository<Employees>
  ) { }
  async findOne(id: number) {
    const employee = await this.employeesRepo.findOne({
      where: { id }, select: [
        'id', 'firstName', 'lastName', 'phone', 'password', 'api_token', 'role',
      ]
    })
    if (!employee) {
      throw new NotFoundException('user not found');
    }
    return employee;
  }

  async findPhoneOne(phone: string) {
    const employee = await this.employeesRepo.findOne({
      where: { phone }, select: [
        'id', 'firstName', 'lastName', 'phone', 'password', 'api_token', 'role',
      ]
    })
    return employee;
  }
}
