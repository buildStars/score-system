/**
 * ⚠️ 重要：此代码必须在所有导入之前执行
 * 修复 @nestjs/schedule 在各种部署环境中的 crypto 问题
 * 
 * 适用环境：Docker, Railway, Render, Heroku 等
 * Node.js 版本：16/18/20+ (已在 package.json 中要求 >=20.0.0)
 */
import * as crypto from 'crypto';

// 立即将 Node.js crypto 模块注入到全局对象
// 这样 @nestjs/schedule 可以在模块初始化时使用 crypto.randomUUID()
if (typeof globalThis !== 'undefined' && !globalThis.crypto) {
  (globalThis as any).crypto = {
    ...crypto,
    // 优先使用原生 randomUUID，如果不存在则使用 polyfill
    randomUUID: crypto.randomUUID?.bind(crypto) || (() => {
      return crypto.randomBytes(16).toString('hex');
    }),
  };
}

// 兼容旧版本 Node.js 环境（< 18）
if (typeof global !== 'undefined' && !(global as any).crypto) {
  (global as any).crypto = {
    ...crypto,
    randomUUID: crypto.randomUUID?.bind(crypto) || (() => {
      return crypto.randomBytes(16).toString('hex');
    }),
  };
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  // 修复 BigInt 序列化问题
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };

  const app = await NestFactory.create(AppModule);

  // 全局前缀
  app.setGlobalPrefix('api');

  // 跨域配置 - 生产环境允许所有来源
  app.enableCors({
    origin: true, // 允许所有来源
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Authorization'],
  });

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  // 全局响应拦截器
  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger文档
  const config = new DocumentBuilder()
    .setTitle('计分系统API文档')
    .setDescription('计分系统后端API接口文档')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 应用启动成功！`);
  console.log(`📡 API地址: http://localhost:${port}/api`);
  console.log(`📚 API文档: http://localhost:${port}/api-docs`);
}

bootstrap();

