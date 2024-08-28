import { ExecutionContext } from '@nestjs/common';
import { User } from '../../src/domain/user/entities/user.entity';

export const jwtAuthGuardMock = (user: User) => ({
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    request.user = user;
    return true;
  },
});
