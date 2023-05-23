import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { RegisterUserDto } from '../auth/dto/register-user.dto';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) readonly userRepository: Repository<User>,
    private readonly notificationService: NotificationService,
  ) {}

  async findById(id: number, includeFollowers?: boolean) {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    queryBuilder.where('user.id = :id', { id });

    if (includeFollowers) {
      queryBuilder
        .leftJoinAndSelect('user.followers', 'followers')
        .leftJoinAndSelect('user.following', 'following')
        .groupBy('user.id, followers.id, following.id');
    }

    const user = await queryBuilder.getOne();

    return user
      ? {
          ...user,
          ...(includeFollowers && {
            followersLength: user.followers?.length || 0,
            followingLength: user.following?.length || 0,
          }),
        }
      : null;
  }

  async findByUsername(username: string, includeFollowers?: boolean) {
    const queryBuilder = this.userRepository.createQueryBuilder('user');
    queryBuilder.where('user.username = :username', { username });

    if (includeFollowers) {
      queryBuilder
        .leftJoinAndSelect('user.followers', 'followers')
        .leftJoinAndSelect('user.following', 'following')
        .groupBy('user.id, followers.id, following.id');
    }

    const user = await queryBuilder.getOne();

    return user
      ? {
          ...user,
          ...(includeFollowers && {
            followersLength: user.followers?.length || 0,
            followingLength: user.following?.length || 0,
          }),
        }
      : null;
  }

  async findByEmail(email: string) {
    return await this.userRepository.findOne({ where: { email } });
  }

  async findByResetToken(resetToken: string) {
    return await this.userRepository.findOne({ where: { resetToken } });
  }

  /**
   * Note: searchUsers differentiates from other find methods in UserService because
   * this one is meant to be used by the authenticated user which is why it requires
   * the user's id and it excludes him from the search results
   */
  async searchUsers(name: string, userId: number) {
    return await this.userRepository
      .createQueryBuilder('user')
      .where('user.name ILIKE :name', { name: `%${name}%` })
      .andWhere('user.id != :userId', { userId })
      .limit(8)
      .getMany();
  }

  async createUser(
    registerDto: RegisterUserDto,
    hashedPassword: string,
    imageUrl: string | null,
  ) {
    return await this.userRepository.save({
      ...registerDto,
      password: hashedPassword,
      profilePicUrl: imageUrl,
    });
  }

  async updateUser(id: number, updateColumns: Partial<User>) {
    // We need to find the existing user first in order to return the entire entity upon completion
    const existingUser = await this.findById(id);

    if (!existingUser)
      throw new BadRequestException('User with that id does not exist');

    return await this.userRepository.save({
      ...existingUser,
      ...updateColumns,
    });
  }

  async getFollowingData(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['following', 'followers'],
    });

    if (!user) {
      throw new Error('User not found');
    }

    return { followers: user.followers, following: user.following };
  }

  async getFollowersOfUser(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['followers'],
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user.followers;
  }

  async getFollowingOfUser(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['following'],
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user.following;
  }

  async followUser(userId: number, userToFollowId: number) {
    if (userId === userToFollowId)
      throw new BadRequestException('You cannot follow yourself');

    const currentUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['following'],
    });
    const userToFollow = await this.userRepository.findOne({
      where: { id: userToFollowId },
      relations: ['followers'],
    });

    if (!currentUser)
      throw new BadRequestException('User with that id does not exist');

    if (!userToFollow)
      throw new BadRequestException(
        'User that you want to follow with that id does not exist',
      );

    const isAlreadyFollowing = currentUser.following.some(
      (user) => user.id === userToFollow.id,
    );

    if (isAlreadyFollowing)
      throw new BadRequestException('User already followed');

    currentUser.following.push({ id: userToFollow.id } as User);
    userToFollow.followers.push({ id: currentUser.id } as User);

    await this.userRepository.save(currentUser);
    await this.userRepository.save(userToFollow);

    await this.notificationService.createNotification({
      type: 'newFollower',
      userToNotify: { id: userToFollow.id } as User,
      user: { id: currentUser.id } as User,
      date: new Date(),
    });

    await this.updateUser(userToFollow.id, {
      unreadNotification: true,
    });

    return currentUser;
  }

  async unfollowUser(userId: number, userToUnfollowId: number) {
    if (userId === userToUnfollowId)
      throw new BadRequestException('You cannot unfollow yourself');

    const currentUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['following'],
    });

    const userToUnfollow = await this.userRepository.findOne({
      where: { id: userToUnfollowId },
      relations: ['followers'],
    });

    if (!currentUser)
      throw new BadRequestException('User with that id does not exist');

    if (!userToUnfollow)
      throw new BadRequestException(
        'User that you want to unfollow with that id does not exist',
      );

    const isCurrentlyFollowing = currentUser.following?.some(
      (user) => user.id === userToUnfollow.id,
    );

    if (!isCurrentlyFollowing)
      throw new BadRequestException('User already unfollowed');

    currentUser.following = currentUser.following.filter(
      (user) => user.id !== userToUnfollow.id,
    );
    userToUnfollow.followers = userToUnfollow.followers.filter(
      (user) => user.id !== currentUser.id,
    );

    await this.userRepository.save(currentUser);
    await this.userRepository.save(userToUnfollow);

    await this.notificationService.deleteNotification({
      type: 'newFollower',
      userToNotify: { id: userToUnfollow.id },
      user: { id: currentUser.id },
    });

    return currentUser;
  }
}
