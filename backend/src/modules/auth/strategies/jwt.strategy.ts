import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    const { sub, type } = payload;

    if (type === 'user') {
      const user = await this.prisma.user.findUnique({
        where: { id: sub },
        select: {
          id: true,
          username: true,
          nickname: true,
          points: true,
          status: true,
        },
      });

      if (!user || user.status !== 1) {
        throw new UnauthorizedException('用户不存在或已被禁用');
      }

      return { ...user, type: 'user' };
    } else if (type === 'admin') {
      const admin = await this.prisma.admin.findUnique({
        where: { id: sub },
        select: {
          id: true,
          username: true,
          realName: true,
          role: true,
          status: true,
        },
      });

      if (!admin || admin.status !== 1) {
        throw new UnauthorizedException('管理员不存在或已被禁用');
      }

      return { ...admin, type: 'admin' };
    }

    throw new UnauthorizedException('无效的用户类型');
  }
}



