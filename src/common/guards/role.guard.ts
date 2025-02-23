import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { UserRole } from 'src/modules/employees/entities/employee.entity';
import { Request } from 'express';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private role: UserRole) { }
  canActivate(context: ExecutionContext,) {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.cookies.accessToken;
    if (this.role !== token.role) {
      throw new ForbiddenException('access denied')
    }
    return true;
  }
}
