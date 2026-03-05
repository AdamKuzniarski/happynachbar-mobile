import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class PresignUploadDto {
  @ApiProperty({ enum: ['avatar', 'activity'] })
  @IsIn(['avatar', 'activity'])
  kind!: 'avatar' | 'activity';

  @ApiProperty({ enum: ['image/jpeg', 'image/png', 'image/webp'] })
  @IsIn(['image/jpeg', 'image/png', 'image/webp'])
  contentType!: 'image/jpeg' | 'image/png' | 'image/webp';
}
