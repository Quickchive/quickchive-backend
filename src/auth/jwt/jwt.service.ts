import { Injectable } from '@nestjs/common';
import { JwtService, JwtVerifyOptions } from '@nestjs/jwt';
import { ONEDAY, ONEYEAR, Payload } from './jwt.payload';

@Injectable()
export class customJwtService {
  constructor(private readonly jwtService: JwtService) {}

  sign(payload: Payload): string {
    return this.jwtService.sign(payload);
  }

  verify(token: string, options?: JwtVerifyOptions): Payload {
    return this.jwtService.verify(token, { secret: options?.secret });
  }

  createPayload(email: string, autoLogin: boolean, sub: number): Payload {
    const period: string = autoLogin ? ONEYEAR : ONEDAY;

    const payload: Payload = { email, period, sub };

    return payload;
  }

  generateRefreshToken(payload: Payload): string {
    const expiresIn: string = payload.period === ONEYEAR ? ONEYEAR : ONEDAY;
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_TOKEN_PRIVATE_KEY,
      expiresIn,
    });
  }
}
