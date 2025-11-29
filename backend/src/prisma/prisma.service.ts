import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ 数据库连接成功');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // 清理数据库连接
  async cleanDatabase() {
    if (process.env.NODE_ENV === 'production') return;
    
    const models = Reflect.ownKeys(this).filter(
      (key) => key[0] !== '_' && typeof this[key as string] === 'object',
    );

    return Promise.all(
      models.map((modelKey) => this[modelKey as string].deleteMany()),
    );
  }
}



