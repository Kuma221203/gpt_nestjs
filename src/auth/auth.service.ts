import { Injectable, UnauthorizedException } from '@nestjs/common';
import ms from 'ms';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Users } from '@prisma/client';
import { TokenPayload } from './interface/token-payload.interface';
import { log } from 'console';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async login(user: Users, response: Response) {
    const expires = new Date();
    const jwtExpiresIn = this.configService.getOrThrow<string>('JWT_EXPIRES_IN');
    console.log(">>>check jwtExpiresIn: ", jwtExpiresIn);
    expires.setMilliseconds(
      expires.getMilliseconds() +
        360000,
    );

    const tokenPayload: TokenPayload = {
      userId: user.id,
      username: user.username || user.email,
      email: user.email,
    };
    const token = this.jwtService.sign(tokenPayload);

    response.cookie('Authentication', token, {
      secure: true,
      httpOnly: true,
      expires,
    });

    return { tokenPayload };
  }

  async verifyUser(email: string, password: string) {
    try {
      const user = await this.usersService.getUser({ email });
      const authenticated = await bcrypt.compare(password, user.password);
      if (!authenticated) {
        throw new UnauthorizedException();
      }
      return user;
    } catch (err) {
      throw new UnauthorizedException('Credentials are not valid.');
    }
  }
}