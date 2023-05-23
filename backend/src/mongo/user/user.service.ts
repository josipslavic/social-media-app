import { BadRequestException, Injectable } from '@nestjs/common';
import { User, UserDocument } from './entities/user.entity';
import { RegisterUserDto } from '../auth/dto/register-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Follower, FollowerDocument } from './entities/follower.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Follower.name)
    private readonly followerModel: Model<FollowerDocument>,
  ) {}

  async findById(id: string, includeFollowers?: boolean) {
    const user = await this.userModel.findById(id).exec();

    let profileFollowStats:
      | {
          numberOfFollowers: number;
          numberOfFollowing: number;
        }[]
      | null = null;

    if (includeFollowers)
      profileFollowStats = await this.followerModel
        .aggregate([
          { $match: { user: { id } } },
          {
            $project: {
              numberOfFollowers: {
                $cond: {
                  if: { $isArray: '$followers' },
                  then: { $size: '$followers' },
                  else: 'NA',
                },
              },

              numberOfFollowing: {
                $cond: {
                  if: { $isArray: '$following' },
                  then: { $size: '$following' },
                  else: 'NA',
                },
              },
            },
          },
        ])
        .exec();

    return user
      ? {
          ...user,
          ...(includeFollowers &&
            profileFollowStats && {
              followersLength: profileFollowStats[0].numberOfFollowers,
              followingLength: profileFollowStats[0].numberOfFollowing,
            }),
        }
      : null;
  }

  async findByUsername(username: string, includeFollowers?: boolean) {
    const user = await this.userModel.findOne({ username }).exec();

    let profileFollowStats:
      | {
          numberOfFollowers: number;
          numberOfFollowing: number;
        }[]
      | null = null;

    if (includeFollowers)
      profileFollowStats = await this.followerModel
        .aggregate([
          { $match: { user: { username } } },
          {
            $project: {
              numberOfFollowers: {
                $cond: {
                  if: { $isArray: '$followers' },
                  then: { $size: '$followers' },
                  else: 'NA',
                },
              },

              numberOfFollowing: {
                $cond: {
                  if: { $isArray: '$following' },
                  then: { $size: '$following' },
                  else: 'NA',
                },
              },
            },
          },
        ])
        .exec();

    return user
      ? {
          ...user,
          ...(includeFollowers &&
            profileFollowStats && {
              followersLength: profileFollowStats[0].numberOfFollowers,
              followingLength: profileFollowStats[0].numberOfFollowing,
            }),
        }
      : null;
  }

  async findByEmail(email: string) {
    return await this.userModel.findOne({ email }).exec();
  }

  async findByResetToken(resetToken: string) {
    return await this.userModel.findOne({ resetToken }).exec();
  }

  /**
   * Note: searchUsers differentiates from other find methods in UserService because
   * this one is meant to be used by the authenticated user which is why it requires
   * the user's id and it excludes him from the search results
   */
  async searchUsers(name: string, userId: string) {
    return await this.userModel
      .find({
        name: { $regex: name, $options: 'i' },
        $nor: [{ id: userId }],
      })
      .exec();
  }

  async createUser(
    registerDto: RegisterUserDto,
    hashedPassword: string,
    imageUrl: string | null,
  ) {
    return await this.userModel.create({
      ...registerDto,
      password: hashedPassword,
      profilePicUrl: imageUrl,
    });
  }

  async updateUser(id: string, updateColumns: Partial<User>) {
    // We need to find the existing user first in order to return the entire entity upon completion
    const existingUser = await this.userModel.findById(id).exec();

    if (!existingUser) {
      throw new BadRequestException('User with that id does not exist');
    }

    existingUser.set(updateColumns);

    return await existingUser.save();
  }

  async getFollowingData(userId: string) {
    const user = await this.followerModel
      .findOne({ user: userId })
      .populate('following.user', 'followers.user')
      .exec();

    if (!user) {
      throw new Error('User not found');
    }

    return { followers: user.followers, following: user.following };
  }

  async getFollowersOfUser(userId: string) {
    const user = await this.followerModel
      .findOne({ user: userId })
      .populate('followers.user')
      .exec();

    if (!user) {
      throw new Error('User not found');
    }

    return user.followers;
  }

  async getFollowingOfUser(userId: string) {
    const user = await this.followerModel
      .findOne({ user: userId })
      .populate('following.user')
      .exec();

    if (!user) {
      throw new Error('User not found');
    }

    return user.following;
  }

  async followUser(userId: string, userToFollowId: string) {
    if (userId === userToFollowId)
      throw new BadRequestException('You cannot follow yourself');

    const currentUser = await this.followerModel.findOne({ user: userId });
    const userToFollow = await this.followerModel.findOne({
      user: userToFollowId,
    });

    if (!currentUser)
      throw new BadRequestException('User with that id does not exist');

    if (!userToFollow)
      throw new BadRequestException(
        'User that you want to follow with that id does not exist',
      );

    const isAlreadyFollowing = currentUser.following.some(
      (following) => following.user.toString() === userToFollowId,
    );

    if (isAlreadyFollowing) {
      throw new BadRequestException('User already followed');
    }

    currentUser.following.unshift({ user: userToFollow.id });
    await currentUser.save();

    userToFollow.followers.unshift({ user: currentUser.id });
    await userToFollow.save();

    return currentUser;
  }

  async unfollowUser(userId: string, userToUnfollowId: string) {
    const currentUser = await this.followerModel.findOne({
      user: userId,
    });

    const userToUnfollow = await this.followerModel.findOne({
      user: userToUnfollowId,
    });

    if (!currentUser)
      throw new BadRequestException('User with that id does not exist');

    if (!userToUnfollow)
      throw new BadRequestException(
        'User that you want to unfollow with that id does not exist',
      );

    const isCurrentlyFollowing = currentUser.following.some(
      (following) => following.user.toString() === userToUnfollowId,
    );

    if (!isCurrentlyFollowing)
      throw new BadRequestException('User already unfollowed');

    currentUser.following = currentUser.following.filter(
      (following) => following.user.toString() !== userToUnfollow.id,
    );
    await currentUser.save();

    userToUnfollow.followers = userToUnfollow.followers.filter(
      (follower) => follower.user.toString() !== currentUser.id,
    );
    await userToUnfollow.save();

    return currentUser;
  }
}
