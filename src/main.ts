import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/exception';
import * as cookieParser from 'cookie-parser';
import { LoggingInterceptor } from './common/logging/logging.interceptor';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe);
  // app.useGlobalFilters(new AllExceptionsFilter()),
  app.enableCors({
    origin: [
      'https://bookshops.liara.run',
      'https://shop.roohbakhshac.ir',
      'http://localhost:3000',
      'https://sep.shaparak.ir',
      'https://www.zarinpal.com'
    ],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })

  app.setGlobalPrefix('api');
  app.use(helmet());
  app.useGlobalInterceptors(new LoggingInterceptor());
  await app.listen(process.env.PORT || 3000);
}

bootstrap();
