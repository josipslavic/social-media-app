import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Post, PostDocument } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { User } from '../user/entities/user.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UserService } from '../user/user.service';
import { FileService } from '../file/file.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

@Injectable()
export class PostService {
  constructor(
    private readonly userService: UserService,
    private readonly fileService: FileService,
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
  ) {}

  /**
   * Finds all posts of users that a particular user if following
   */
  async findAll(userId: string, take: number, skip?: number) {
    const followingIds = (
      await this.userService.getFollowingOfUser(userId)
    ).map((following) => '' + following.user.id); // Nedd to convert because of typescript yelling

    followingIds.push(userId);

    return await this.postModel
      .find({
        user: {
          $in: followingIds,
        },
      })
      .limit(take)
      .sort({ createdAt: -1 })
      .populate('user')
      .populate('comments.user')
      .skip(skip || 0);
  }

  async findAllFromUser(username: string) {
    return await this.postModel
      .find({ 'user.username': username })
      .sort({ createdAt: -1 })
      .populate('user')
      .populate('comments.user')
      .exec();
  }

  async findById(postId: string) {
    return await this.postModel.findById(postId).exec();
  }

  async createPost(
    userId: string,
    createPostDto: CreatePostDto,
    picUrl?: string,
  ) {
    const newPost = new this.postModel({
      user: userId,
      text: createPostDto.text,
      location: createPostDto.location,
      picUrl: picUrl || null,
      likes: [],
      comments: [],
    });

    const createdPost = await newPost.save();
    return createdPost;
  }

  async createComment(
    postId: string,
    user: User,
    createCommentDto: CreateCommentDto,
  ) {
    const post = await this.postModel.findById(postId).populate('user').exec();

    if (!post) {
      throw new Error('Post not found');
    }

    const newComment = {
      _id: new Types.ObjectId().toString(),
      user: user.id,
      text: createCommentDto.text,
      date: new Date(),
    };

    post.comments.push(newComment);

    return post.save();
  }

  async deletePost(postId: string, userId: string) {
    const post = await this.postModel
      .findOneAndDelete({ id: postId, user: userId })
      .exec();

    if (!post) {
      throw new BadRequestException('Post not found');
    }

    const imageUrl = post.picUrl;

    await this.fileService.deletePublicFile(imageUrl);

    return post;
  }

  async deleteComment(postId: string, commentId: string) {
    const post = await this.postModel
      .findOne({ id: postId })
      .populate('user')
      .populate('comments')
      .populate('comments')
      .exec();

    if (!post) {
      throw new BadRequestException('Post not found');
    }

    const commentIndex = post.comments.findIndex(
      (comment) => comment._id.toString() === commentId,
    );
    if (commentIndex === -1) {
      throw new BadRequestException('Comment not found');
    }
    post.comments.splice(commentIndex, 1);

    return await post.save();
  }

  async likePost(postId: string, user: User) {
    const post = await this.postModel.findById(postId).populate('user').exec();

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const likedByUser = post.likes.some(
      (like) => like.user.toString() === user.id,
    );

    if (likedByUser) {
      throw new BadRequestException('Post already liked by the user');
    }

    post.likes.push({ user });
    return post.save();
  }

  async unlikePost(postId: string, user: User) {
    const post = await this.postModel.findById(postId);

    if (!post) {
      throw new Error('Post not found');
    }

    const index = post.likes.findIndex(
      (like) => like.user.toString() === user.id,
    );

    if (index === -1) {
      throw new Error('User has not liked this post');
    }

    if (post.comments[index].user.toString() !== user.id) {
      throw new BadRequestException('Comment does not belong to this user');
    }

    post.likes.splice(index, 1);

    await post.save();

    return post;
  }

  async getPostLikes(postId: string) {
    const post = await this.postModel.findById(postId).populate('likes.user');

    if (!post) {
      throw new Error('Post not found');
    }

    return post.likes;
  }
}
