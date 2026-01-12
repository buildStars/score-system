import { Controller, Get, Put, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StatisticsQueryDto } from './dto/statistics-query.dto';
import { QueryAdminLogDto } from './dto/query-admin-log.dto';
import { ChangeAdminPasswordDto } from './dto/change-admin-password.dto';

@ApiTags('管理员')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles('admin', 'superadmin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('statistics')
  @ApiOperation({ summary: '获取统计数据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getStatistics(@Query() query: StatisticsQueryDto) {
    return this.adminService.getStatistics(query);
  }

  @Get('logs')
  @ApiOperation({ summary: '获取管理员操作日志' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAdminLogs(@Query() query: QueryAdminLogDto) {
    return this.adminService.getAdminLogs(query);
  }

  @Put('change-password')
  @ApiOperation({ summary: '修改管理员密码' })
  @ApiResponse({ status: 200, description: '修改成功' })
  async changePassword(
    @CurrentUser() admin: any,
    @Body() dto: ChangeAdminPasswordDto,
  ) {
    return this.adminService.changePassword(admin.id, dto.oldPassword, dto.newPassword);
  }

  @Get('profile')
  @ApiOperation({ summary: '获取当前管理员信息' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getProfile(@CurrentUser() admin: any) {
    return this.adminService.getProfile(admin.id);
  }
}



