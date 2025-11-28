import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PointService } from './point.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { QueryPointRecordDto } from './dto/query-point-record.dto';

@ApiTags('积分')
@ApiBearerAuth()
@Controller()
export class PointController {
  constructor(private readonly pointService: PointService) {}

  @Get('user/point-records')
  @ApiOperation({ summary: '获取积分记录' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getUserPointRecords(
    @CurrentUser() user: any,
    @Query() query: QueryPointRecordDto,
  ) {
    return this.pointService.getUserPointRecords(user.id, query);
  }

  @Get('admin/point-records')
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiOperation({ summary: '获取所有积分记录（管理员）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAllPointRecords(@Query() query: QueryPointRecordDto) {
    return this.pointService.getAllPointRecords(query);
  }
}



