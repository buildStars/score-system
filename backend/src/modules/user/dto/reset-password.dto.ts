import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ description: '新密码', example: '123456' })
  @IsString()
  @IsNotEmpty({ message: '新密码不能为空' })
  @MinLength(6, { message: '新密码至少6个字符' })
  @MaxLength(20, { message: '新密码最多20个字符' })
  newPassword: string;
}



