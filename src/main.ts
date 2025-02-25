import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/exception';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe);
  // app.useGlobalFilters(new AllExceptionsFilter()),
  app.enableCors({
    origin: ['https://bookshops.liara.run', 'http://localhost:3000'],
    // origin: '*',
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
