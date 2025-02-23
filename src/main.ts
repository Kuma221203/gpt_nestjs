import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';


import { AppModule } from './app.module';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.enableCors({
    origin: app.get(ConfigService).getOrThrow('FRONTEND_URL'), 
    credentials: true,
  });
  app.use(cookieParser());
  await app.listen(app.get(ConfigService).getOrThrow('PORT'));
}
bootstrap();
