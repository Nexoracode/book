import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, originalUrl } = req;
    const userAgent = req.get('user-agent') || '';
    const ip = req.ip;

    console.log(`🚀 [Request] ${method} ${originalUrl} - IP: ${ip} - Agent: ${userAgent}`);

    const now = Date.now();
    return next.handle().pipe(
      tap(() => {
        console.log(`✅ [Response] ${method} ${originalUrl} - Duration: ${Date.now() - now}ms`);
      }),
    );
  }
}
