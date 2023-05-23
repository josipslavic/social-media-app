import { Exclude } from 'class-transformer';
import { Notification } from 'src/pg/notification/entities/notification.entity';
import { Comment } from 'src/pg/post/entities/comment.entity';
import { Post } from 'src/pg/post/entities/post.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ unique: true })
  username: string;

  @Column({ type: 'varchar', nullable: true })
  profilePicUrl: string | null;

  @Column({ default: true })
  newMessagePopup: boolean;

  @Column({ default: false })
  unreadMessage: boolean;

  @Column({ default: false })
  unreadNotification: boolean;

  @Column({ default: 'user', enum: ['user', 'root'] })
  role: 'user' | 'root';

  @Column({ type: 'varchar', nullable: true })
  resetToken: string | null;

  @Column({ type: 'timestamp', nullable: true })
  expireToken: Date | null;

  @Column()
  bio: string;

  @Column()
  facebook: string;

  @Column()
  twitter: string;

  @Column()
  youtube: string;

  @Column()
  instagram: string;

  @ManyToMany(() => User, (user) => user.following, { cascade: true })
  @JoinTable()
  followers: User[];

  @ManyToMany(() => User, (user) => user.followers)
  following: User[];

  @OneToMany(() => Post, (post) => post.user, { cascade: true })
  posts: Post[];

  @ManyToMany(() => Post, (post) => post.likes, { cascade: true })
  likedPosts: Post[];

  @OneToMany(() => Comment, (comment) => comment.user, { cascade: true })
  comments: Comment[];

  @OneToMany(() => Notification, (notification) => notification.userToNotify, {
    cascade: true,
  })
  notifications: Notification[];

  @OneToMany(() => Notification, (notification) => notification.user, {
    cascade: true,
  })
  givenNotifications: Notification[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
