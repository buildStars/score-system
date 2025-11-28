import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { AdjustPointsDto } from './dto/adjust-points.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取用户信息
   */
  async getUserInfo(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        nickname: true,
        points: true,
        status: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  /**
   * 修改密码
   */
  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 验证旧密码
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('旧密码错误');
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: '密码修改成功' };
  }

  /**
   * 创建用户（管理员）
   */
  async createUser(createUserDto: CreateUserDto, adminId: number) {
    // 检查用户名是否已存在
    const existingUser = await this.prisma.user.findUnique({
      where: { username: createUserDto.username },
    });

    if (existingUser) {
      throw new BadRequestException('用户名已存在');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // 创建用户
    const user = await this.prisma.user.create({
      data: {
        username: createUserDto.username,
        password: hashedPassword,
        nickname: createUserDto.nickname,
        points: createUserDto.points || 0,
      },
      select: {
        id: true,
        username: true,
        nickname: true,
        points: true,
        status: true,
        createdAt: true,
      },
    });

    // 如果有初始积分，记录积分变动
    if (createUserDto.points > 0) {
      await this.prisma.pointRecord.create({
        data: {
          userId: user.id,
          type: 'admin_add',
          amount: createUserDto.points,
          balanceBefore: 0,
          balanceAfter: createUserDto.points,
          remark: '初始充值',
          operatorId: adminId,
          operatorType: 'admin',
        },
      });
    }

    return user;
  }

  /**
   * 获取用户列表（管理员）
   */
  async getUserList(query: QueryUserDto) {
    const { page, limit, keyword, status } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    // 关键词搜索
    if (keyword) {
      where.OR = [
        { username: { contains: keyword } },
        { nickname: { contains: keyword } },
      ];
    }

    // 状态筛选
    if (status) {
      where.status = status;
    }

    // 查询总数
    const total = await this.prisma.user.count({ where });

    // 查询列表
    const list = await this.prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        username: true,
        nickname: true,
        points: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      list,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 调整用户积分（管理员）
   */
  async adjustUserPoints(
    userId: number,
    adjustPointsDto: AdjustPointsDto,
    adminId: number,
    adminUsername: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const { amount, remark } = adjustPointsDto;
    const currentPoints = Number(user.points);
    const newPointsWithDecimal = currentPoints + amount; // 可能有小数

    if (newPointsWithDecimal < 0) {
      throw new BadRequestException('调整后积分不能为负数');
    }

    // 向下取整，用户余额只存整数
    const newPoints = Math.floor(newPointsWithDecimal);

    // 使用事务更新
    await this.prisma.$transaction(async (tx) => {
      // 更新用户积分（整数）
      await tx.user.update({
        where: { id: userId },
        data: { points: newPoints },
      });

      // 记录积分变动（保留小数，显示详细变动）
      await tx.pointRecord.create({
        data: {
          userId,
          type: amount > 0 ? 'admin_add' : 'admin_deduct',
          amount,  // 保留小数
          balanceBefore: currentPoints,  // 保留小数
          balanceAfter: newPoints,  // 向下取整后的值
          remark,
          operatorId: adminId,
          operatorType: 'admin',
        },
      });

      // 记录管理员操作日志
      await tx.adminLog.create({
        data: {
          adminId,
          adminUsername,
          action: 'update_points',
          resourceType: 'user',
          resourceId: userId.toString(),
          description: `调整用户积分: ${user.username} ${amount > 0 ? '增加' : '减少'}${Math.abs(amount)}积分`,
          requestData: { userId, amount, remark },
        },
      });
    });

    return {
      userId,
      username: user.username,
      pointsBefore: user.points,
      pointsAfter: newPoints,
      amount,
      remark,
    };
  }

  /**
   * 重置用户密码（管理员）
   */
  async resetUserPassword(
    userId: number,
    newPassword: string,
    adminId: number,
    adminUsername: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码并记录日志
    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      await tx.adminLog.create({
        data: {
          adminId,
          adminUsername,
          action: 'reset_password',
          resourceType: 'user',
          resourceId: userId.toString(),
          description: `重置用户密码: ${user.username}`,
        },
      });
    });

    return { message: '密码重置成功' };
  }

  /**
   * 更新用户状态（管理员）
   */
  async updateUserStatus(
    userId: number,
    status: number,
    adminId: number,
    adminUsername: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const statusText = { 1: '正常', 2: '禁用', 3: '冻结' }[status];

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { status },
      });

      await tx.adminLog.create({
        data: {
          adminId,
          adminUsername,
          action: 'update_status',
          resourceType: 'user',
          resourceId: userId.toString(),
          description: `更新用户状态: ${user.username} -> ${statusText}`,
        },
      });
    });

    return { message: '用户状态更新成功' };
  }
}

