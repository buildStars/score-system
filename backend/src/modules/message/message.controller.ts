import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { QueryMessageDto } from './dto/query-message.dto';
import { ReplyMessageDto } from './dto/reply-message.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('留言管理')
@Controller('message')
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post('submit')
  @ApiOperation({ summary: '提交留言（用户端，无需登录）' })
  async create(@Body() createMessageDto: CreateMessageDto) {
    return this.messageService.create(createMessageDto);
  }

  @Get('list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: '查询留言列表（管理端）' })
  async findAll(@Query() query: QueryMessageDto) {
    return this.messageService.findAll(query);
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取未读留言数量' })
  async getUnreadCount() {
    return this.messageService.getUnreadCount();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: '查询留言详情' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.messageService.findOne(id);
  }

  @Post(':id/reply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: '回复留言' })
  async reply(
    @Param('id', ParseIntPipe) id: number,
    @Body() replyDto: ReplyMessageDto,
    @Req() req: any,
  ) {
    const adminId = req.user.id;
    return this.messageService.reply(id, replyDto, adminId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除留言' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.messageService.remove(id);
  }

  @Post('batch-delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'superadmin')
  @ApiBearerAuth()
  @ApiOperation({ summary: '批量删除留言' })
  async batchRemove(@Body('ids') ids: number[]) {
    return this.messageService.batchRemove(ids);
  }
}

