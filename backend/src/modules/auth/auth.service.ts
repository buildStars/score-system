import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto, AdminLoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * 用户登录
   */
  async userLogin(loginDto: LoginDto, ipAddress?: string) {
    const { username, password } = loginDto;

    // 查找用户
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 检查用户状态
    if (user.status !== 1) {
      throw new UnauthorizedException('用户已被禁用或冻结');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 更新登录信息
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });

    // 生成Token
    const token = this.generateToken(user.id, 'user');
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN') || '7d';

    return {
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        points: user.points,
        status: user.status,
      },
      token,
      expiresIn: this.getExpiresInSeconds(expiresIn),
    };
  }

  /**
   * 管理员登录
   */
  async adminLogin(loginDto: AdminLoginDto, ipAddress?: string, userAgent?: string) {
    const { username, password } = loginDto;

    // 查找管理员
    const admin = await this.prisma.admin.findUnique({
      where: { username },
    });

    if (!admin) {
      throw new UnauthorizedException('管理员账号或密码错误');
    }

    // 检查状态
    if (admin.status !== 1) {
      throw new UnauthorizedException('管理员账号已被禁用');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('管理员账号或密码错误');
    }

    // 更新登录信息
    await this.prisma.admin.update({
      where: { id: admin.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });

    // 记录登录日志
    await this.prisma.adminLog.create({
      data: {
        adminId: admin.id,
        adminUsername: admin.username,
        action: 'login',
        description: '管理员登录',
        ipAddress,
        userAgent,
      },
    });

    // 生成Token
    const token = this.generateToken(admin.id, 'admin');
    const expiresIn = this.configService.get<string>('JWT_ADMIN_EXPIRES_IN') || '12h';

    return {
      admin: {
        id: admin.id,
        username: admin.username,
        realName: admin.realName,
        role: admin.role,
      },
      token,
      expiresIn: this.getExpiresInSeconds(expiresIn),
    };
  }

  /**
   * 生成JWT Token
   */
  private generateToken(userId: number, type: 'user' | 'admin'): string {
    const payload = { sub: userId, type };
    const expiresIn = type === 'user' 
      ? this.configService.get<string>('JWT_EXPIRES_IN')
      : this.configService.get<string>('JWT_ADMIN_EXPIRES_IN');

    return this.jwtService.sign(payload, { expiresIn });
  }

  /**
   * 将时间字符串转换为秒数
   */
  private getExpiresInSeconds(expiresIn: string): number {
    const unit = expiresIn.slice(-1);
    const value = parseInt(expiresIn.slice(0, -1));

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 24 * 60 * 60;
      default: return 7 * 24 * 60 * 60; // 默认7天
    }
  }

  /**
   * 验证Token
   */
  async validateToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch (error) {
      throw new UnauthorizedException('Token无效或已过期');
    }
  }
}



