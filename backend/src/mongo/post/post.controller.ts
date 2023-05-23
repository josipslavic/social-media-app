import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { PostService } from './post.service';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreatePostDto } from './dto/create-post.dto';
import RequestWithUser from '../common/types/request-with-user';
import { FileService } from '../file/file.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@UseGuards(JwtAuthGuard)
@Controller('post')
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly fileService: FileService,
  ) {}

  @Get()
  async getPostsFromFollowedUsers(
    @Req() req: RequestWithUser,
    @Query('page-number') pageNumber: number,
  ) {
    return await this.postService.findAll(req.user.id, 8, 8 * (pageNumber - 1));
  }

  @UseInterceptors(FileInterceptor('file'))
  @Post()
  async createPost(
    @Req() req: RequestWithUser,
    @Body() createPostDto: CreatePostDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    let picUrl;
    if (file)
      picUrl = await this.fileService.uploadPublicFile(
        file.buffer,
        file.originalname.split('.')[0],
      );

    return await this.postService.createPost(
      req.user.id,
      createPostDto,
      picUrl,
    );
  }

  @Get('/single/:postId')
  async getSinglePost(@Param('postId') postId: string) {
    return await this.postService.findById(postId);
  }

  @Get('/user/:username')
  async getPostsOfUser(@Param('username') username: string) {
    return await this.postService.findAllFromUser(username);
  }

  @Post('/comment/:postId')
  async createComment(
    @Req() req: RequestWithUser,
    @Body() createCommentDto: CreateCommentDto,
    @Param('postId') postId: string,
  ) {
    return await this.postService.createComment(
      postId,
      req.user,
      createCommentDto,
    );
  }

  @Patch('like/:postId')
  async likePost(@Req() req: RequestWithUser, @Param('postId') postId: string) {
    return await this.postService.likePost(postId, req.user);
  }

  @Patch('unlike/:postId')
  async unlikePost(
    @Req() req: RequestWithUser,
    @Param('postId') postId: string,
  ) {
    return await this.postService.unlikePost(postId, req.user);
  }

  @Get('/likes/:postId')
  async getLikesOfPost(@Param('postId') postId: string) {
    return await this.postService.getPostLikes(postId);
  }

  @Delete('/:postId')
  async deletePost(
    @Req() req: RequestWithUser,
    @Param('postId') postId: string,
  ) {
    return await this.postService.deletePost(postId, req.user.id);
  }

  @Delete('/comment/:postId/:commentId')
  async deleteComment(
    @Req() req: RequestWithUser,
    @Param('postId') postId: string,
    @Param('commentId') commentId: string,
  ) {
    return await this.postService.deleteComment(postId, commentId);
  }
}
