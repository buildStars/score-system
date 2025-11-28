import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { AdjustPointsDto } from './dto/adjust-points.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@ApiTags('用户')
@ApiBearerAuth()
@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('user/info')
  @ApiOperation({ summary: '获取用户信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUserInfo(@CurrentUser() user: any) {
    return this.userService.getUserInfo(user.id);
  }

  @Post('user/change-password')
  @ApiOperation({ summary: '修改密码' })
  @ApiResponse({ status: 200, description: '修改成功' })
  async changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.userService.changePassword(
      user.id,
      changePasswordDto.oldPassword,
      changePasswordDto.newPassword,
    );
  }

  @Post('admin/users')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: '创建用户（管理员）' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async createUser(
    @CurrentUser() admin: any,
    @Body() createUserDto: CreateUserDto,
  ) {
    return this.userService.createUser(createUserDto, admin.id);
  }

  @Get('admin/users')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: '获取用户列表（管理员）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUserList(@Query() query: QueryUserDto) {
    return this.userService.getUserList(query);
  }

  @Put('admin/users/:id/points')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: '调整用户积分（管理员）' })
  @ApiResponse({ status: 200, description: '调整成功' })
  async adjustUserPoints(
    @Param('id', ParseIntPipe) userId: number,
    @Body() adjustPointsDto: AdjustPointsDto,
    @CurrentUser() admin: any,
  ) {
    return this.userService.adjustUserPoints(
      userId,
      adjustPointsDto,
      admin.id,
      admin.username,
    );
  }

  @Put('admin/users/:id/password')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: '重置用户密码（管理员）' })
  @ApiResponse({ status: 200, description: '重置成功' })
  async resetUserPassword(
    @Param('id', ParseIntPipe) userId: number,
    @Body() resetPasswordDto: ResetPasswordDto,
    @CurrentUser() admin: any,
  ) {
    return this.userService.resetUserPassword(
      userId,
      resetPasswordDto.newPassword,
      admin.id,
      admin.username,
    );
  }

  @Put('admin/users/:id/status')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: '更新用户状态（管理员）' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateUserStatus(
    @Param('id', ParseIntPipe) userId: number,
    @Body() updateStatusDto: UpdateStatusDto,
    @CurrentUser() admin: any,
  ) {
    return this.userService.updateUserStatus(
      userId,
      updateStatusDto.status,
      admin.id,
      admin.username,
    );
  }
}



