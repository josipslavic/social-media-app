import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory, Reflector } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Access the respective apps config service that will guarantee to be validated
  const configService = app.get(ConfigService);

  // Enable CORS for frontend
  app.enableCors({
    origin: [configService.get('FRONTEND_URL') as string],
    credentials: true,
  });

  // Use global validation pipe that will handle DTO transformation
  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      forbidUnknownValues: false, // WARNING: This has to be included due to a current know NestJS issue that sometimes causes errors during DTO validation
      transform: true,
    }),
  );

  // ClassSerializerInterceptor is needed for serialization of objects that are returned in a network response
  // This allows us to exclude sensetive information such as the user's password during responses
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  app.use(cookieParser());

  await app.listen(8000);
}
bootstrap();
