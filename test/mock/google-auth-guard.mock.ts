import { ExecutionContext } from '@nestjs/common';
import { googleUserInfo } from '../../src/auth/dtos/google.dto';

export const googleAuthGuardMock = (googleUserInfo?: googleUserInfo) => ({
  canActivate: (context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    request.user = googleUserInfo;

    if (!googleUserInfo) {
      response.redirect();
    }

    return true;
  },
});
