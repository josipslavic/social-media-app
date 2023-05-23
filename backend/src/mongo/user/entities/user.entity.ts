import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ type: MongooseSchema.Types.ObjectId })
  _id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ required: true, unique: true, trim: true })
  username: string;

  @Prop()
  profilePicUrl: string;

  @Prop({ default: true })
  newMessagePopup: boolean;

  @Prop({ default: false })
  unreadMessage: boolean;

  @Prop({ default: false })
  unreadNotification: boolean;

  @Prop({ default: 'user', enum: ['user', 'root'] })
  role: string;

  @Prop()
  resetToken: string;

  @Prop()
  expireToken: Date;

  @Prop({ required: true })
  bio: string;

  @Prop()
  facebook: string;

  @Prop()
  twitter: string;

  @Prop()
  youtube: string;

  @Prop()
  instagram: string;

  get id(): string {
    return this._id.toString();
  }
}

export const UserSchema = SchemaFactory.createForClass(User);
