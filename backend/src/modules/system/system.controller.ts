import { Controller, Get, Put, Post, Body, UseGuards, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SystemService } from './system.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { UpdateBetSettingsDto } from './dto/update-bet-settings.dto';
import { UpdateSystemSettingsDto } from './dto/update-system-settings.dto';
import { ClearDataDto } from './dto/clear-data.dto';
import { UpdateBetTypeSettingDto, BatchUpdateBetTypeSettingsDto } from './dto/bet-type-setting.dto';

@ApiTags('系统设置')
@Controller()
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @Get('admin/settings')
  @ApiOperation({ summary: '获取所有设置（下注设置+系统设置）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getSettings() {
    const betSettings = await this.systemService.getBetSettings();
    const systemSettings = await this.systemService.getSystemSettings();
    return {
      betSettings,
      systemSettings,
    };
  }

  @Public()
  @Get('system/settings/public')
  @ApiOperation({ summary: '获取公开系统设置（网站标题等）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getPublicSystemSettings() {
    const allSettings = await this.systemService.getSystemSettings();
    // 只返回公开的设置
    return {
      siteTitle: allSettings.siteTitle || '计分系统',
      siteSubtitle: allSettings.siteSubtitle || '一分耕耘，一分收获',
    };
  }

  @Public()
  @Get('admin/bet-settings')
  @ApiOperation({ summary: '获取下注设置（公开接口）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getBetSettings() {
    return this.systemService.getBetSettings();
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @Put('admin/bet-settings')
  @ApiOperation({ summary: '更新下注设置' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateBetSettings(
    @Body() updateDto: UpdateBetSettingsDto,
    @CurrentUser() admin: any,
  ) {
    return this.systemService.updateBetSettings(
      updateDto,
      admin.id,
      admin.username,
    );
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @Get('admin/system-settings')
  @ApiOperation({ summary: '获取系统设置' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getSystemSettings() {
    return this.systemService.getSystemSettings();
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @Put('admin/system-settings')
  @ApiOperation({ summary: '更新系统设置' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateSystemSettings(
    @Body() updateDto: UpdateSystemSettingsDto,
    @CurrentUser() admin: any,
  ) {
    return this.systemService.updateSystemSettings(
      updateDto,
      admin.id,
      admin.username,
    );
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('superadmin') // 仅超级管理员可以清空数据
  @Post('admin/clear-data')
  @ApiOperation({ summary: '清空指定时间数据' })
  @ApiResponse({ status: 200, description: '清空成功' })
  async clearData(
    @Body() clearDataDto: ClearDataDto,
    @CurrentUser() admin: any,
  ) {
    return this.systemService.clearData(
      clearDataDto,
      admin.id,
      admin.username,
    );
  }

  // ==================== 下注类型配置 ====================
  
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @Get('admin/bet-type-settings')
  @ApiOperation({ summary: '获取所有下注类型配置' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getBetTypeSettings() {
    return this.systemService.getBetTypeSettings();
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @Get('admin/bet-type-settings/:betType')
  @ApiOperation({ summary: '获取指定下注类型配置' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getBetTypeSetting(@Param('betType') betType: string) {
    return this.systemService.getBetTypeSetting(betType);
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @Put('admin/bet-type-settings/:betType')
  @ApiOperation({ summary: '更新指定下注类型配置' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateBetTypeSetting(
    @Param('betType') betType: string,
    @Body() updateDto: UpdateBetTypeSettingDto,
    @CurrentUser() admin: any,
  ) {
    return this.systemService.updateBetTypeSetting(
      betType,
      updateDto,
      admin.id,
      admin.username,
    );
  }

  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles('admin', 'superadmin')
  @Post('admin/bet-type-settings/batch')
  @ApiOperation({ summary: '批量更新下注类型配置' })
  @ApiResponse({ status: 200, description: '批量更新成功' })
  async batchUpdateBetTypeSettings(
    @Body() batchUpdateDto: BatchUpdateBetTypeSettingsDto,
    @CurrentUser() admin: any,
  ) {
    return this.systemService.batchUpdateBetTypeSettings(
      batchUpdateDto,
      admin.id,
      admin.username,
    );
  }
}

