import { Comment } from 'src/pg/post/entities/comment.entity';
import { Post } from 'src/pg/post/entities/post.entity';
import { User } from 'src/pg/user/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ enum: ['newLike', 'newComment', 'newFollower'] })
  type: 'newLike' | 'newComment' | 'newFollower';

  @Column({ nullable: true })
  text: string;

  @Column({ type: 'timestamp', default: new Date() })
  date: Date;

  @ManyToOne(() => User, (user) => user.notifications)
  userToNotify: User;

  @ManyToOne(() => User, (user) => user.givenNotifications)
  user: User;

  @ManyToOne(() => Post, (post) => post.notifications)
  post: Post;

  @ManyToOne(() => Comment, (comment) => comment.notifications)
  comment: Comment;
}
