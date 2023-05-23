import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * LocalAuthGuard is used for validating login credentials by implementing the local_auth strategy that is defined in
 * [backend/src/pg/auth/strategy/local-auth.strategy.ts](../strategy/local-auth.strategy.ts)
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local_auth') {}
