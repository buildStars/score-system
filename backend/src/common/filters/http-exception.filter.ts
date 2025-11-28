import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    const exceptionResponse: any = exception.getResponse();
    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : exceptionResponse.message || '请求失败';

    const errorResponse = {
      code: status,
      message: Array.isArray(message) ? message[0] : message,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // 记录错误日志
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      console.error('Internal Server Error:', exception);
    }

    response.status(status).json(errorResponse);
  }
}



