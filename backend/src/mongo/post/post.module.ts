import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { FileModule } from '../file/file.module';
import { UserModule } from '../user/user.module';
import { Post, PostSchema } from './entities/post.entity';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Post.name, schema: PostSchema }]),
    FileModule,
    UserModule,
  ],
  providers: [PostService],
  controllers: [PostController],
})
export class PostModule {}
