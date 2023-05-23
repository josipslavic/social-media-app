import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import RequestWithUser from '../common/types/request-with-user';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateUserDto } from './dto/update-user.dto';
import { FileService } from '../file/file.service';
import { UpdatePasswordDto } from './dto/update-password.dto';
import { compare, hash } from 'bcrypt';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly fileService: FileService,
  ) {}

  @Get('/info/:userId')
  async getUserInfoById(@Param('userId') userId: string) {
    return await this.userService.findById(userId);
  }

  @Get('/profile/:username')
  async searchProfile(@Param('username') username: string) {
    const userData = await this.userService.findByUsername(username, true);

    if (!userData) throw new NotFoundException('User not found');

    // Make sure we don't send any sensetive information
    return {
      profile: {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        profilePicUrl: userData.profilePicUrl,
        bio: userData.bio,
        facebook: userData.facebook,
        twitter: userData.twitter,
        youtube: userData.youtube,
        instagram: userData.instagram,
      },
      followersLength: userData.followersLength,
      followingLength: userData.followingLength,
    } as Partial<User> & { followersLength: number; followingLength: number };
  }

  @UseInterceptors(FileInterceptor('file'))
  @Patch('/update')
  async updateProfile(
    @Req() req: RequestWithUser,
    @Body() registerDto: UpdateUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let imageUrl: string | null = null;
    const originalPfp = req.user.profilePicUrl;

    if (file)
      imageUrl = await this.fileService.uploadPublicFile(
        file.buffer,
        file.originalname.split('.')[0],
      );

    const returnValue = await this.userService.updateUser(req.user.id, {
      ...registerDto,
      ...(imageUrl && { profilePicUrl: imageUrl }),
    });

    if (imageUrl && originalPfp) this.fileService.deletePublicFile(originalPfp);

    return returnValue;
  }

  @Get('/search/:query')
  async searchUser(@Req() req: RequestWithUser, @Param('query') query: string) {
    return await this.userService.searchUsers(query, req.user.id);
  }

  @Patch('/follow/:userId')
  async followUser(
    @Req() req: RequestWithUser,
    @Param('userId') userId: string,
  ) {
    return await this.userService.followUser(req.user.id, userId);
  }

  @Patch('/unfollow/:userId')
  async unfollowUser(
    @Req() req: RequestWithUser,
    @Param('userId') userId: string,
  ) {
    return await this.userService.unfollowUser(req.user.id, userId);
  }

  @Get('/followers/:userId')
  async getUsersFollowers(@Param('userId') userId: string) {
    return await this.userService.getFollowersOfUser(userId);
  }

  @Get('/following/:userId')
  async getUsersFollowing(@Param('userId') userId: string) {
    return await this.userService.getFollowingOfUser(userId);
  }

  @Patch('/notifications')
  async setUserNotificationsToRead(@Req() req: RequestWithUser) {
    return await this.userService.updateUser(req.user.id, {
      unreadNotification: false,
    });
  }

  @Patch('/settings/update-password')
  async updatePassword(
    @Req() req: RequestWithUser,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    if (!(await compare(updatePasswordDto.currentPassword, req.user.password)))
      throw new BadRequestException('Incorrect current password');

    return await this.userService.updateUser(req.user.id, {
      password: await hash(updatePasswordDto.newPassword, 10),
    });
  }
}
