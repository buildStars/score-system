import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { StatisticsQueryDto } from './dto/statistics-query.dto';
import { QueryAdminLogDto } from './dto/query-admin-log.dto';

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
}



