import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { StrategyModel } from './strategy.enum';

@Injectable()
export class RefreshGuard extends AuthGuard(StrategyModel.REFRESH_STRATEGY) {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (!user || err) {
      throw new UnauthorizedException('token is missed');
    }
    console.log(user);
    return user;
  }
}
