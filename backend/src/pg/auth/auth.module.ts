import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserModule } from '../user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { LocalAuthStrategy } from './strategy/local-auth.strategy';
import { JwtAuthStrategy } from './strategy/jwt-auth.strategy';
import { FileModule } from '../file/file.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    UserModule,
    FileModule,
    ConfigModule,
    PassportModule,
    EmailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_ACCESS_TOKEN'),
        signOptions: {
          expiresIn: `${configService.get('JWT_EXPIRATION_TIME')}`,
        },
      }),
    }),
  ],
  providers: [AuthService, LocalAuthStrategy, JwtAuthStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
