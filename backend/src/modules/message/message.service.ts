import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { QueryMessageDto } from './dto/query-message.dto';
import { ReplyMessageDto } from './dto/reply-message.dto';

@Injectable()
export class MessageService {
  constructor(private prisma: PrismaService) {}

  /**
   * 创建留言（用户端）
   */
  async create(createMessageDto: CreateMessageDto) {
    const message = await this.prisma.message.create({
      data: {
        name: createMessageDto.name,
        contact: createMessageDto.contact,
        message: createMessageDto.message,
        status: 'unread',
      },
    });

    return {
      message: '留言提交成功，我们会尽快与您联系',
      data: message,
    };
  }

  /**
   * 查询留言列表（管理端）
   */
  async findAll(query: QueryMessageDto) {
    const { status, keyword, page = 1, pageSize = 20 } = query;
    
    const where: any = {};
    
    // 按状态筛选
    if (status) {
      where.status = status;
    }
    
    // 关键词搜索
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { contact: { contains: keyword } },
        { message: { contains: keyword } },
      ];
    }

    const [total, list] = await Promise.all([
      this.prisma.message.count({ where }),
      this.prisma.message.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * 查询单条留言详情
   */
  async findOne(id: number) {
    const message = await this.prisma.message.findUnique({
      where: { id },
    });

    if (!message) {
      throw new Error('留言不存在');
    }

    // 如果是未读状态，标记为已读
    if (message.status === 'unread') {
      await this.prisma.message.update({
        where: { id },
        data: { status: 'read' },
      });
      message.status = 'read';
    }

    return message;
  }

  /**
   * 回复留言（管理端）
   */
  async reply(id: number, replyDto: ReplyMessageDto, adminId: number) {
    const message = await this.prisma.message.findUnique({
      where: { id },
    });

    if (!message) {
      throw new Error('留言不存在');
    }

    const updated = await this.prisma.message.update({
      where: { id },
      data: {
        adminReply: replyDto.adminReply,
        status: 'replied',
        repliedAt: new Date(),
        repliedBy: adminId,
      },
    });

    return {
      message: '回复成功',
      data: updated,
    };
  }

  /**
   * 删除留言（管理端）
   */
  async remove(id: number) {
    const message = await this.prisma.message.findUnique({
      where: { id },
    });

    if (!message) {
      throw new Error('留言不存在');
    }

    await this.prisma.message.delete({
      where: { id },
    });

    return {
      message: '删除成功',
    };
  }

  /**
   * 批量删除留言
   */
  async batchRemove(ids: number[]) {
    await this.prisma.message.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return {
      message: `已删除 ${ids.length} 条留言`,
    };
  }

  /**
   * 获取未读留言数量
   */
  async getUnreadCount() {
    const count = await this.prisma.message.count({
      where: { status: 'unread' },
    });

    return { count };
  }
}

