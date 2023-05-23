import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostController } from './post.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { Post } from './entities/post.entity';
import { FileModule } from '../file/file.module';
import { UserModule } from '../user/user.module';
import { EventsModule } from '../events/events.module';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Post, Comment]),
    FileModule,
    UserModule,
    NotificationModule,
    EventsModule,
  ],
  providers: [PostService],
  controllers: [PostController],
})
export class PostModule {}
