import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../../pg/user/entities/user.entity';

export type FollowerDocument = Follower & Document;

@Schema()
export class Follower {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  user: User;

  @Prop([
    {
      user: { type: MongooseSchema.Types.ObjectId, ref: 'User' },
    },
  ])
  followers: {
    user: User;
  }[];

  @Prop([
    {
      user: { type: MongooseSchema.Types.ObjectId, ref: 'User' },
    },
  ])
  following: {
    user: User;
  }[];
}

export const FollowerSchema = SchemaFactory.createForClass(Follower);
