import { Injectable } from '@nestjs/common';
import { JwtService, JwtVerifyOptions } from '@nestjs/jwt';
import { refreshTokenExpiration } from '../auth.module';
import { ONEMONTH, Payload, TWOHOUR } from './jwt.payload';

@Injectable()
export class customJwtService {
  constructor(private readonly jwtService: JwtService) {}

  sign(payload: Payload): string {
    return this.jwtService.sign(payload);
  }

  verify(token: string, options?: JwtVerifyOptions): Payload {
    return this.jwtService.verify(token, { secret: options.secret });
  }

  createPayload(email, autoLogin, sub): Payload {
    const period: string = autoLogin ? ONEMONTH : TWOHOUR;

    const payload: Payload = { email, period, sub };

    return payload;
  }

  generateRefreshToken(payload: Payload): string {
    const expiresIn: string =
      payload.period === ONEMONTH ? refreshTokenExpiration : TWOHOUR;
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_TOKEN_PRIVATE_KEY,
      expiresIn,
    });
  }
}
