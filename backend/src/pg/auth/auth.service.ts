import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserService } from '../user/user.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { RegisterUserDto } from './dto/register-user.dto';
import * as crypto from 'crypto';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async registerUser(registerDto: RegisterUserDto, imageUrl: string | null) {
    //Check if user already exists in our PG database
    const userWithSameEmail = await this.userService.findByEmail(
      registerDto.email,
    );
    if (userWithSameEmail) {
      throw new ConflictException('User with this email already exists');
    }
    const userWithSameUsername = await this.userService.findByUsername(
      registerDto.username,
    );
    if (userWithSameUsername)
      throw new ConflictException('User with this username already exists');

    const hashedPassword = await hash(registerDto.password, 10);
    return await this.userService.createUser(
      registerDto,
      hashedPassword,
      imageUrl,
    );
  }

  async getAuthenticatedUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email);
    console.log(user);
    if (!user)
      throw new BadRequestException('User with that email has not been found');
    console.log(user);
    await this.verifyPassword(password, user.password);
    return user;
  }

  async verifyPassword(password: string, hashedPassword: string) {
    const isPasswordMatching = await compare(password, hashedPassword);
    if (!isPasswordMatching) {
      throw new BadRequestException('Invalid credentials provided');
    }
  }

  async generateResetToken(email: string) {
    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new NotFoundException('User with that email does not exist');
    }

    const token = crypto.randomBytes(32).toString('hex');

    const userWithToken = await this.userService.updateUser(user.id, {
      resetToken: token,
      expireToken: new Date(Date.now() + 3600000), // Token exipres in 1h from now
    });

    const href = `${this.configService.get('FRONTEND_URL')}/reset/${token}`;

    await this.emailService.sendMail({
      to: userWithToken.email,
      from: 'jopisla@gmail.com',
      subject: 'Hi there! Here is your password reset request',
      html: `<p>Hey ${userWithToken.name
        .split(' ')[0]
        .toString()}, There was a request for password reset. <a href=${href}>Click this link to reset the password </a>   </p>
        <p>This token is valid for only 1 hour.</p>`,
    });

    return userWithToken;
  }

  async resetPassword(token: string, password: string) {
    const user = await this.userService.findByResetToken(token);

    // The user is guaranteed to have a reset token since we found him by it, but still
    // check for the exipreToken value just in case
    if (!user || !user.expireToken) {
      throw new HttpException('Token not found', 498);
    }

    if (new Date() > user.expireToken) {
      throw new HttpException('Token has expired', 498);
    }

    const hashedPassword = await hash(password, 10);

    return await this.userService.updateUser(user.id, {
      password: hashedPassword,
      resetToken: undefined,
      expireToken: undefined,
    });
  }

  async getCookieWithJwtToken(userId: number, hashedPassword: string) {
    const payload = { sub: { userId } };
    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_TOKEN_EXPIRATION_TIME'),
    });
    return `Authorization=${token}; HttpOnly; Path=/; Max-Age=${this.configService.get(
      'JWT_ACCESS_TOKEN_EXPIRATION_TIME',
    )}`;
  }

  getCookieForLogOut() {
    return 'Authorization=; HttpOnly; Path=/; Max-Age=0';
  }
}
