import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { Repository } from 'typeorm';
import { CreatePostDto } from './dto/create-post.dto';
import { User } from '../user/entities/user.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from './entities/comment.entity';
import { UserService } from '../user/user.service';
import { EventsGateway } from '../events/events.gateway';
import { NotificationService } from '../notification/notification.service';
import { FileService } from '../file/file.service';

@Injectable()
export class PostService {
  constructor(
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
    private readonly fileService: FileService,
    private readonly eventsGateway: EventsGateway,
    @InjectRepository(Post) readonly postRepository: Repository<Post>,
    @InjectRepository(Comment) readonly commentRepository: Repository<Comment>,
  ) {}

  /**
   * Finds all posts of users that a particular user if following
   */
  async findAll(userId: number, take: number, skip?: number) {
    const followingIds = (
      await this.userService.getFollowingOfUser(userId)
    ).map((user) => user.id);

    followingIds.push(userId);

    const query = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.likes', 'likes')
      .leftJoinAndSelect('post.comments', 'comments')
      .leftJoinAndSelect('comments.user', 'commentUser')
      .where('user.id IN (:...followingIds)', { followingIds })
      .orderBy('post.createdAt', 'DESC')
      .addOrderBy('comments.date', 'DESC')
      .take(take);

    if (skip) {
      query.skip(skip);
    }

    return await query.getMany();
  }

  async findAllFromUser(username: string) {
    return this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.likes', 'likes')
      .leftJoinAndSelect('post.comments', 'comments')
      .leftJoinAndSelect('comments.user', 'commentUser')
      .where('user.username = :username', { username })
      .orderBy('post.createdAt', 'DESC')
      .addOrderBy('comments.date', 'DESC')
      .getMany();
  }

  async findById(postId: number) {
    return this.postRepository.findOne({
      where: { id: postId },
      relations: ['user', 'comments', 'comments.user', 'likes'],
      order: { comments: { date: -1 } },
    });
  }

  async createPost(
    userId: number,
    createPostDto: CreatePostDto,
    picUrl?: string,
  ) {
    return await this.postRepository.save({
      ...createPostDto,
      picUrl,
      user: { id: userId },
    });
  }

  async createComment(
    postId: number,
    user: User,
    createCommentDto: CreateCommentDto,
  ) {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['comments', 'user'],
    });

    if (!post) {
      throw new Error('Post not found');
    }

    const comment = await this.commentRepository.save({
      ...createCommentDto,
      user: user,
      post: post,
    });

    if (post.user.id !== user.id) {
      await this.notificationService.createNotification({
        type: 'newComment',
        userToNotify: { id: post.user.id } as User,
        user: { id: user.id } as User,
        post: { id: post.id } as Post,
        comment: { id: comment.id } as Comment,
        date: new Date(),
      });

      await this.userService.updateUser(post.user.id, {
        unreadNotification: true,
      });
    }

    return comment;
  }

  async deletePost(postId: number, userId: number) {
    const post = await this.postRepository.findOne({
      where: { id: postId, user: { id: userId } },
    });

    if (!post) throw new BadRequestException('Post not found');

    const imageUrl = post.picUrl;

    await this.postRepository.delete({ id: postId, user: { id: userId } });
    await this.fileService.deletePublicFile(imageUrl);

    return post;
  }

  async deleteComment(postId: number, commentId: number, userId: number) {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['user', 'comments', 'comments.user'],
    });

    if (!post) {
      throw new BadRequestException('Post not found');
    }

    console.log(post.comments, commentId);

    const commentIndex = post.comments.findIndex(
      (comment) => comment.id === commentId,
    );
    if (commentIndex === -1) {
      throw new BadRequestException('Comment not found');
    }

    if (post.comments[commentIndex].user.id !== userId)
      throw new BadRequestException('Comment does not belong to this user');

    post.comments.splice(commentIndex, 1);

    const returnedPost = this.postRepository.save(post);

    this.notificationService.deleteNotification({
      type: 'newComment',
      userToNotify: { id: post.user.id },
      user: { id: userId },
    });

    return returnedPost;
  }

  async likePost(postId: number, user: User) {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['likes', 'user'],
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const likedByUser = post.likes.some((like) => like.id === user.id);

    if (likedByUser) {
      throw new BadRequestException('Post already liked by the user');
    }

    post.likes.push(user);
    await this.postRepository.save(post);

    if (post.user.id !== user.id) {
      await this.notificationService.createNotification({
        type: 'newLike',
        userToNotify: { id: post.user.id } as User,
        user: { id: user.id } as User,
        post: { id: post.id } as Post,
        date: new Date(),
      });

      await this.userService.updateUser(post.user.id, {
        unreadNotification: true,
      });

      const receiverSocket = this.eventsGateway.findConnectedUserSocket(
        post.user.id,
      );

      if (receiverSocket) {
        console.log('RECEIVER SOCKET EXISTS', receiverSocket);

        this.eventsGateway.server
          .to(receiverSocket.socketId)
          .emit('newNotificationReceived', {
            name: user.name,
            profilePicUrl: user.profilePicUrl,
            username: user.username,
            postId,
          });
      }
    }

    return post;
  }

  async unlikePost(postId: number, user: User) {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['likes', 'user'],
    });

    if (!post) {
      throw new Error('Post not found');
    }

    const index = post.likes.findIndex((likedUser) => likedUser.id === user.id);

    if (index === -1) {
      throw new Error('User has not liked this post');
    }

    post.likes.splice(index, 1);
    await this.postRepository.save(post);

    if (post.user.id !== user.id) {
      await this.notificationService.deleteNotification({
        type: 'newLike',
        user: { id: user.id },
        post: { id: post.id },
      });
    }

    return post;
  }

  async getPostLikes(postId: number): Promise<User[]> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['likes'],
    });

    if (!post) {
      throw new Error('Post not found');
    }

    return post.likes;
  }
}
