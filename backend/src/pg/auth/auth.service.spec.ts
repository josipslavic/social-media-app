import { Test } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from 'src/pg/user/entities/user.entity';
import { UserService } from 'src/pg/user/user.service';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { MockedJwtService } from 'test/mocks/jwt.service';
import { MockedConfigService } from 'test/mocks/config.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { userStub } from 'test/stubs/user.stub';
import { createMock } from '@golevelup/ts-jest';
import {
  BadRequestException,
  ConflictException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let userService: UserService;
  let emailService: EmailService;
  let configService: ConfigService;
  let jwtService: JwtService;
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: createMock<UserService>() },
        { provide: EmailService, useValue: createMock<EmailService>() },
        {
          provide: ConfigService,
          useValue: MockedConfigService,
        },
        {
          provide: JwtService,
          useValue: MockedJwtService,
        },
        {
          provide: getRepositoryToken(User),
          useValue: {},
        },
      ],
    }).compile();
    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    emailService = module.get<EmailService>(EmailService);
    configService = module.get(ConfigService);
    jwtService = module.get(JwtService);

    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should throw ConflictException if user with the same email already exists', async () => {
      const registerDto: RegisterUserDto = {
        name: 'John Doe',
        email: 'johndoe@example.com',
        username: 'johndoe',
        password: 'password123',
        bio: 'I am John Doe',
        facebook: 'johndoe_facebook',
        youtube: 'johndoe_youtube',
        twitter: 'johndoe_twitter',
        instagram: 'johndoe_instagram',
      };

      jest
        .spyOn(userService, 'findByEmail')
        .mockResolvedValue(userStub as User);

      await expect(
        authService.registerUser(registerDto, 'someUrl'),
      ).rejects.toThrowError(ConflictException);
    });

    it('should throw ConflictException if user with the same username already exists', async () => {
      const registerDto: RegisterUserDto = {
        name: 'John Doe',
        email: 'johndoe@example.com',
        username: 'johndoe',
        password: 'password123',
        bio: 'I am John Doe',
        facebook: 'johndoe_facebook',
        youtube: 'johndoe_youtube',
        twitter: 'johndoe_twitter',
        instagram: 'johndoe_instagram',
      };

      jest.spyOn(userService, 'findByEmail').mockResolvedValue(null);
      jest
        .spyOn(userService, 'findByUsername')
        .mockResolvedValue(userStub as User);

      await expect(
        authService.registerUser(registerDto, 'someUrl'),
      ).rejects.toThrowError(ConflictException);
    });

    it('should return a new user if no user with the same email or username exists', async () => {
      const registerDto: RegisterUserDto = {
        name: 'John Doe',
        email: 'johndoe@example.com',
        username: 'johndoe',
        password: 'password123',
        bio: 'I am John Doe',
        facebook: 'johndoe_facebook',
        youtube: 'johndoe_youtube',
        twitter: 'johndoe_twitter',
        instagram: 'johndoe_instagram',
      };

      jest.spyOn(userService, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(userService, 'findByUsername').mockResolvedValue(null);
      jest.spyOn(userService, 'createUser').mockResolvedValue(userStub as User);

      const result = await authService.registerUser(registerDto, 'someUrl');

      expect(result).toEqual(userStub);
    });
  });

  describe('getAuthenticatedUser', () => {
    it('should throw BadRequestException if user with the given email is not found', async () => {
      const email = 'nonexistent@example.com';
      const hashedPassword = 'hashedPassword';

      jest.spyOn(userService, 'findByEmail').mockResolvedValue(null);

      await expect(
        authService.getAuthenticatedUser(email, hashedPassword),
      ).rejects.toThrowError(BadRequestException);
    });

    it('should throw BadRequestException if the password hash does not match', async () => {
      const email = 'john@example.com';
      const hashedPassword = 'invalidHash';

      jest
        .spyOn(userService, 'findByEmail')
        .mockResolvedValue(userStub as User);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));

      await expect(
        authService.getAuthenticatedUser(email, hashedPassword),
      ).rejects.toThrowError(BadRequestException);
    });

    it('should return the user if the password hash matches', async () => {
      const email = 'john@example.com';
      const hashedPassword = 'hashedPassword';

      jest
        .spyOn(userService, 'findByEmail')
        .mockResolvedValue(userStub as User);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));

      const result = await authService.getAuthenticatedUser(
        email,
        hashedPassword,
      );

      expect(result).toEqual(userStub);
    });
  });

  describe('verifyPassword', () => {
    const password = 'password';
    const hashedPassword = 'hashedPassword';

    it('should throw BadRequestException if the password hashes do not match', async () => {
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));

      await expect(
        authService.verifyPassword(password, hashedPassword),
      ).rejects.toThrowError(BadRequestException);
    });

    it('should return without error if the password hashes match', async () => {
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));

      await expect(
        authService.verifyPassword(password, hashedPassword),
      ).resolves.toBeUndefined();
    });
  });

  describe('generateResetToken', () => {
    it('should throw NotFoundException if user with the provided email does not exist', async () => {
      jest.spyOn(userService, 'findByEmail').mockResolvedValue(null);

      const email = 'nonexistent@example.com';

      await expect(authService.generateResetToken(email)).rejects.toThrowError(
        NotFoundException,
      );
    });

    it('should call update user correctly', async () => {
      jest
        .spyOn(userService, 'findByEmail')
        .mockResolvedValue(userStub as User);
      jest.spyOn(userService, 'updateUser').mockResolvedValue({
        ...userStub,
        resetToken: 'sometoken',
        expireToken: new Date(Date.now() + 100000),
      } as User);
      const updateUserSpy = jest.spyOn(userService, 'updateUser');

      await authService.generateResetToken(userStub.email);

      expect(updateUserSpy).toHaveBeenCalledWith(userStub.id, {
        resetToken: expect.any(String),
        expireToken: expect.any(Date),
      });
    });

    it('should call email service correctly', async () => {
      jest
        .spyOn(userService, 'findByEmail')
        .mockResolvedValue(userStub as User);
      jest.spyOn(userService, 'updateUser').mockResolvedValue({
        ...userStub,
        resetToken: 'sometoken',
        expireToken: new Date(Date.now() + 100000),
      } as User);
      const sendMailSpy = jest.spyOn(emailService, 'sendMail');

      await authService.generateResetToken(userStub.email);

      expect(sendMailSpy).toHaveBeenCalledWith({
        to: userStub.email,
        from: expect.any(String),
        subject: expect.any(String),
        html: expect.stringContaining('<a href='),
      });
    });
  });

  describe('resetPassword', () => {
    it('should throw an error if no user is found', async () => {
      jest.spyOn(userService, 'findByResetToken').mockResolvedValue(null);

      await expect(
        authService.resetPassword('token', 'newPassword'),
      ).rejects.toThrow(HttpException);
    });

    it('should throw an error if the user has no expire token', async () => {
      const userWithoutExpireToken = { ...userStub, expireToken: null };
      jest
        .spyOn(userService, 'findByResetToken')
        .mockResolvedValue(userWithoutExpireToken as User);

      await expect(
        authService.resetPassword('token', 'newPassword'),
      ).rejects.toThrow(HttpException);
    });

    it('should throw an error if the token has expired', async () => {
      const expiredUser = {
        ...userStub,
        expireToken: new Date(Date.now() - 1),
      };
      jest
        .spyOn(userService, 'findByResetToken')
        .mockResolvedValue(expiredUser as User);

      await expect(
        authService.resetPassword('token', 'newPassword'),
      ).rejects.toThrow(HttpException);
    });

    it('should call updateUser with new password hash and no tokens', async () => {
      const updateUserSpy = jest.spyOn(userService, 'updateUser');
      const hashedPassword = 'hashedPassword';
      jest.spyOn(userService, 'findByResetToken').mockResolvedValue({
        ...userStub,
        resetToken: 'sometoken',
        expireToken: new Date(Date.now() + 100000),
      } as User);
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(() => Promise.resolve(hashedPassword));

      await authService.resetPassword('token', 'newPassword');

      expect(updateUserSpy).toHaveBeenCalledWith(userStub.id, {
        password: hashedPassword,
        resetToken: undefined,
        expireToken: undefined,
      });
    });
  });

  describe('getCookieWithJwtToken', () => {
    it('should retun a signed token', async () => {
      const userId = 1;
      const hashedPassword = 'hashedPassword';

      await expect(
        authService.getCookieWithJwtToken(userId, hashedPassword),
      ).resolves.toBe(
        `Authorization=${await jwtService.signAsync({
          sub: { userId, hashedPassword },
        })}; HttpOnly; Path=/; Max-Age=${configService.get(
          'JWT_ACCESS_TOKEN_EXPIRATION_TIME',
        )}`,
      );
    });
  });

  describe('getCookieForLogOut', () => {
    it('should retun an empty cookie', () => {
      expect(authService.getCookieForLogOut()).toBe(
        'Authorization=; HttpOnly; Path=/; Max-Age=0',
      );
    });
  });
});
