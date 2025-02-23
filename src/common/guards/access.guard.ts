import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StrategyModel } from './strategy.enum';

@Injectable()
export class AccessGuard extends AuthGuard(StrategyModel.ACCESS_STRATEGY) {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (!user || err) {
      throw new UnauthorizedException('token is missed');
    }
    return user;
  }
}
