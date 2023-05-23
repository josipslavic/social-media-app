import { User } from 'src/pg/user/entities/user.entity';
import { Post } from './post.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Notification } from 'src/pg/notification/entities/notification.entity';

@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  text: string;

  @Column({ type: 'timestamp', default: new Date() })
  date: Date;

  @ManyToOne(() => Post, (post) => post.comments)
  post: Post;

  @ManyToOne(() => User, (user) => user.comments)
  user: User;

  @OneToMany(() => Notification, (notification) => notification.comment, {
    cascade: true,
  })
  notifications: Notification[];
}
