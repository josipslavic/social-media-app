import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JwtAuthGuard is used for verifying the JWT's signature, decoding its payload which will contain the userId and their hashed
 * password and then fetching the user from the database by implementing the jwt_auth strategy that is defined in
 * [backend/src/pg/auth/strategy/jwt-auth.strategy.ts](../strategy/jwt-auth.strategy.ts)
 *
 * Note: For further security there should be a session implementation so that we can also invalidate tokens if needed, but due
 * to this being a dummy project, we will check if the hashed password matches so that we can invalidate all tokens if the user
 * changes their password
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt_auth') {}
