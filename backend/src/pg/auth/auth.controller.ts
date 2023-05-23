import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guard/jwt-auth.guard';
import RequestWithUser from '../common/types/request-with-user';
import { LocalAuthGuard } from './guard/local-auth.guard';
import { RegisterUserDto } from './dto/register-user.dto';
import { UserService } from '../user/user.service';
import { isEmail } from 'class-validator';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from '../file/file.service';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly fileService: FileService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAuthUser(
    @Req() req: RequestWithUser,
    @Query('getFollowingData') getFollowingData: boolean,
  ) {
    const userFollowStats = getFollowingData
      ? await this.userService.getFollowingData(req.user.id)
      : null;
    return { user: req.user, userFollowStats };
  }

  @UseInterceptors(FileInterceptor('file'))
  @Post('/register')
  async register(
    @Res({ passthrough: true }) res: Response,
    @Body() registerDto: RegisterUserDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let imageUrl: string;

    if (file)
      imageUrl = await this.fileService.uploadPublicFile(
        file.buffer,
        file.originalname.split('.')[0],
      );
    else
      imageUrl =
        'https://portfolio-project-sma-bucket.s3.eu-central-1.amazonaws.com/defaultpfp.jpeg';

    const user = await this.authService.registerUser(registerDto, imageUrl);
    const cookie = await this.authService.getCookieWithJwtToken(
      user.id,
      user.password,
    );
    res.setHeader('Set-Cookie', cookie).status(201).json({ user });
  }

  @Get('/is-taken/:username')
  async checkIfUsernameIsTaken(@Param('username') username: string) {
    const user = await this.userService.findByUsername(username);

    if (user) throw new ConflictException('Username already taken');

    return { available: true };
  }

  @HttpCode(200)
  @UseGuards(LocalAuthGuard)
  @Post('/login')
  async login(
    @Req() req: RequestWithUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    console.log('HIT HERE');
    const { user } = req;
    const accessTokenCookie = await this.authService.getCookieWithJwtToken(
      user.id,
      user.password,
    );
    console.log(accessTokenCookie);
    res.setHeader('Set-Cookie', accessTokenCookie).json({ user });
  }

  @HttpCode(200)
  @UseGuards(JwtAuthGuard)
  @Post('/logout')
  async logOut(@Res({ passthrough: true }) res: Response) {
    res.setHeader('Set-Cookie', this.authService.getCookieForLogOut());
    return { message: 'success' };
  }

  @Post('/reset')
  async requestPasswordReset(@Query('email') email: string) {
    if (!isEmail(email))
      throw new BadRequestException('Please provide a valid email address');
    await this.authService.generateResetToken(email);
  }

  @Post('/reset/token')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.password,
    );
  }
}
