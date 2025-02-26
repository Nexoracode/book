import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UtilCookie } from 'src/common/utils/cookie.util';
import { UtilToken } from 'src/common/utils/token.util';
import { JwtModule } from '@nestjs/jwt';
import { Employees } from '../employees/entities/employee.entity';
import { EmployeesModule } from '../employees/employees.module';

@Module({
  imports: [JwtModule, EmployeesModule, TypeOrmModule.forFeature([Employees])],
  controllers: [AuthController],
  providers: [AuthService, UtilCookie, UtilToken],
  exports: [AuthService],
})
export class AuthModule { }
