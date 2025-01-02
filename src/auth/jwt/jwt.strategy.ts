import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Payload } from './jwt.payload';
import { UserRepository } from '../../users/repository/user.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userRepository: UserRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_TOKEN_PRIVATE_KEY,
    });
  }

  async validate(payload: Payload) {
    const user = await this.userRepository.findOneBy({ id: payload.sub });
    if (user) {
      return user;
    } else {
      throw new UnauthorizedException('User Not Found');
    }
  }
}
