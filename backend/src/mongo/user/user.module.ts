import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { User, UserSchema } from './entities/user.entity';
import { UserController } from './user.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Follower, FollowerSchema } from './entities/follower.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Follower.name, schema: FollowerSchema },
    ]),
  ],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
