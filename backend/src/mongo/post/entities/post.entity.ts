import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from 'src/mongo/user/entities/user.entity';

export type PostDocument = Post & Document;

@Schema({ timestamps: true })
export class Post {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  user: User;

  @Prop({ required: true })
  text: string;

  @Prop()
  location: string;

  @Prop()
  picUrl: string;

  @Prop([{ user: { type: MongooseSchema.Types.ObjectId, ref: 'User' } }])
  likes: { user: User }[];

  @Prop([
    {
      _id: { type: String, required: true },
      user: { type: MongooseSchema.Types.ObjectId, ref: 'User' },
      text: { type: String, required: true },
      date: { type: Date, default: Date.now },
    },
  ])
  comments: {
    _id: string;
    user: string;
    text: string;
    date: Date;
  }[];
}

export const PostSchema = SchemaFactory.createForClass(Post);
