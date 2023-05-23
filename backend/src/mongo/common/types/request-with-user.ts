import { Request } from 'express';
import { User } from 'src/mongo/user/entities/user.entity';

interface RequestWithUser extends Request {
  user: User & { id: string };
}

export default RequestWithUser;
