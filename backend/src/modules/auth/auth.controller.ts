import { Controller, Post, Body, Ip, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto, AdminLoginDto } from './dto/login.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('认证')
@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('user/login')
  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({ status: 200, description: '登录成功' })
  @ApiResponse({ status: 401, description: '用户名或密码错误' })
  async userLogin(
    @Body() loginDto: LoginDto,
    @Ip() ipAddress: string,
  ) {
    return this.authService.userLogin(loginDto, ipAddress);
  }

  @Public()
  @Post('admin/login')
  @ApiOperation({ summary: '管理员登录' })
  @ApiResponse({ status: 200, description: '登录成功' })
  @ApiResponse({ status: 401, description: '账号或密码错误' })
  async adminLogin(
    @Body() loginDto: AdminLoginDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ) {
    return this.authService.adminLogin(loginDto, ipAddress, userAgent);
  }
}



