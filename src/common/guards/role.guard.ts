import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserRole } from 'src/modules/employees/entities/employee.entity';
import { Request } from 'express';

interface CustomRequest extends Request {
  user: {
    role: UserRole
  }
}

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private role: UserRole) { }
  canActivate(context: ExecutionContext,) {
    const request = context.switchToHttp().getRequest<CustomRequest>();
    const employee = request.user;
    if (!employee || employee.role !== this.role) {
      throw new ForbiddenException('You do not have permission to access this resource.');
    }
    return true;
  }
}
