import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { RegisterUserDto } from '../auth/dto/register-user.dto';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { userStub, userStub2, userStub3 } from 'test/stubs/user.stub';
import { BadRequestException } from '@nestjs/common';
import { Post } from '../post/entities/post.entity';
import { Notification } from '../notification/entities/notification.entity';
import { NotificationService } from '../notification/notification.service';
import { Comment } from '../post/entities/comment.entity';
import { createMock } from '@golevelup/ts-jest';

const NON_EXISTANT_USERID = 53;

describe('UserService', () => {
  let module: TestingModule;
  let userService: UserService;
  let savedUser: User;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        // We need to import the actual module in order to use test DB
        TypeOrmModule.forRootAsync({
          imports: [
            ConfigModule.forRoot({
              envFilePath: '.test.env', // Test DB credentials
            }),
          ],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            type: 'postgres',
            host: configService.get('POSTGRES_HOST'),
            port: configService.get('POSTGRES_PORT'),
            username: configService.get('POSTGRES_USER'),
            password: configService.get('POSTGRES_PASSWORD'),
            database: configService.get('POSTGRES_DB'),
            autoLoadEntities: true,
            synchronize: true,
            dropSchema: true,
          }),
        }),
        TypeOrmModule.forFeature([User, Post, Notification, Comment]),
      ],
      providers: [
        UserService,
        ConfigService,
        { provide: NotificationService, useValue: createMock<UserService>() },
      ],
    }).compile();
    userService = module.get<UserService>(UserService);

    jest.clearAllMocks();

    // Clear the database before each test
    await userService.userRepository.query('DELETE FROM "user"');

    // Populate the database with dummy values
    const dummyUsers = [userStub2 as Partial<User>, userStub3 as Partial<User>];
    savedUser = (await userService.userRepository.save(dummyUsers))[0];
  });

  afterEach(async () => {
    await module.close();
  });

  describe('findById', () => {
    it('should return null if the user with the given id does not exist', async () => {
      await expect(userService.findById(NON_EXISTANT_USERID)).resolves.toBe(
        null,
      );
    });

    it('should return user without followers and following if second parameter is not provided', async () => {
      await expect(userService.findById(savedUser.id)).resolves.toEqual(
        savedUser,
      );
    });

    it('should return user with followers and following if second parameter is true', async () => {
      await expect(userService.findById(savedUser.id, true)).resolves.toEqual({
        ...savedUser,
        followers: [],
        followersLength: 0,
        following: [],
        followingLength: 0,
      });
    });
  });

  describe('findByEmail', () => {
    it('should return null if the user with the given email does not exist', async () => {
      await expect(
        userService.findByEmail('nonexistantemail@example.com'),
      ).resolves.toBe(null);
    });

    it('should return user if the user with the given email exists', async () => {
      await expect(userService.findByEmail(savedUser.email)).resolves.toEqual(
        savedUser,
      );
    });
  });

  describe('findByUsername', () => {
    it('should return null if the user with the given username does not exist', async () => {
      await expect(
        userService.findByUsername('nonexistantusername'),
      ).resolves.toBe(null);
    });

    it('should return user without followers and following if second parameter is not provided', async () => {
      await expect(
        userService.findByUsername(savedUser.username),
      ).resolves.toEqual(savedUser);
    });

    it('should return user with followers and following if second parameter is true', async () => {
      await expect(userService.findById(savedUser.id, true)).resolves.toEqual({
        ...savedUser,
        followers: [],
        followersLength: 0,
        following: [],
        followingLength: 0,
      });
    });
  });

  describe('findByResetToken', () => {
    it('should return null if the user with the given email does not exist', async () => {
      await expect(
        userService.findByResetToken('nonexistanttoken'),
      ).resolves.toBe(null);
    });

    it('should return user if the user with the given email exists', async () => {
      await expect(
        userService.findByResetToken(savedUser.resetToken as string),
      ).resolves.toEqual(savedUser);
    });
  });

  describe('searchUsers', () => {
    it('should return user if it only includes the initial letters of their name', async () => {
      await expect(
        userService.searchUsers(userStub2.name.slice(0, 4), userStub3.id),
      ).resolves.toEqual([userStub2]);
    });

    it('should return user if it only includes non-inital letters of their name', async () => {
      await expect(
        userService.searchUsers(
          userStub2.name.slice(4, userStub2.name.length - 1),
          userStub3.id,
        ),
      ).resolves.toEqual([userStub2]);
    });

    it('should not return user if their own id is included in the second parameter', async () => {
      await expect(
        userService.searchUsers(userStub2.name, userStub2.id),
      ).resolves.toEqual([]);
    });
  });

  describe('createUser', () => {
    it('should throw an error if it violates both unique username and unique email constraints', async () => {
      const registerDto: RegisterUserDto = {
        name: 'John Doe',
        email: userStub2.email,
        username: userStub2.username,
        password: 'password123',
        bio: 'I am John Doe',
        facebook: 'johndoe_facebook',
        youtube: 'johndoe_youtube',
        twitter: 'johndoe_twitter',
        instagram: 'johndoe_instagram',
      };
      const hashedPassword = 'hashedPassword';

      await expect(
        userService.createUser(registerDto, hashedPassword, null),
      ).rejects.toThrow();
    });

    it('should throw an error if it violates unique username constraint', async () => {
      const registerDto: RegisterUserDto = {
        name: 'John Doe',
        email: 'otheremail@example.com',
        username: userStub2.username,
        password: 'password123',
        bio: 'I am John Doe',
        facebook: 'johndoe_facebook',
        youtube: 'johndoe_youtube',
        twitter: 'johndoe_twitter',
        instagram: 'johndoe_instagram',
      };
      const hashedPassword = 'hashedPassword';

      await expect(
        userService.createUser(registerDto, hashedPassword, null),
      ).rejects.toThrow();
    });

    it('should throw an error if it violates unique email constraint', async () => {
      const registerDto: RegisterUserDto = {
        name: 'John Doe',
        email: userStub2.email,
        username: 'otherusername',
        password: 'password123',
        bio: 'I am John Doe',
        facebook: 'johndoe_facebook',
        youtube: 'johndoe_youtube',
        twitter: 'johndoe_twitter',
        instagram: 'johndoe_instagram',
      };
      const hashedPassword = 'hashedPassword';

      await expect(
        userService.createUser(registerDto, hashedPassword, null),
      ).rejects.toThrow();
    });

    it('should return a user if username and email constraints are not violated', async () => {
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
      const hashedPassword = 'hashedPassword';

      await expect(
        userService.createUser(registerDto, hashedPassword, null),
      ).resolves.toEqual({
        ...userStub,
        id: expect.any(Number),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });

  describe('updateUser', () => {
    const updateColumns: Partial<User> = { resetToken: 'othertoken' };

    it('should throw BadRequestException if user with the given id is not found', async () => {
      await expect(
        userService.updateUser(NON_EXISTANT_USERID, updateColumns),
      ).rejects.toThrowError(BadRequestException);
    });

    it('should return user after update', async () => {
      const updatedUser = await userService.updateUser(
        savedUser.id,
        updateColumns,
      );

      expect(updatedUser).toEqual({
        ...savedUser,
        ...updateColumns,
        updatedAt: updatedUser.updatedAt,
      });
    });
  });

  describe('getFollowingData', () => {
    beforeEach(async () => {
      await userService.userRepository.save({
        ...savedUser,
        following: [{ id: userStub3.id }],
        followers: [{ id: userStub3.id }],
      });
    });

    it('should retun information in correct format', async () => {
      await expect(userService.getFollowingData(savedUser.id)).resolves.toEqual(
        {
          followers: expect.arrayContaining([expect.any(Object)]),
          following: expect.arrayContaining([expect.any(Object)]),
        },
      );
    });
  });
});
