import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { User } from 'src/pg/user/entities/user.entity';

@Injectable()
export class LocalAuthStrategy extends PassportStrategy(
  Strategy,
  'local_auth',
) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email', // Users will use their email to log in
    });
  }
  async validate(email: string, password: string): Promise<User> {
    console.log(email, password);
    return this.authService.getAuthenticatedUser(email, password);
  }
}
