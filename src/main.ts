import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/exception';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe);
  // app.useGlobalFilters(new AllExceptionsFilter()),
  app.enableCors({
    // origin: ['https://bookshops.liara.run'],
    origin: '*',
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
  })

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
