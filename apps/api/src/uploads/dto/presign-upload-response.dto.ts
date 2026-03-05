import { ApiProperty } from '@nestjs/swagger';

export class PresignUploadResponseDto {
  @ApiProperty()
  assetUrl!: string;

  @ApiProperty()
  key!: string;

  @ApiProperty()
  uploadUrl!: string;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } })
  uploadFiles!: Record<string, string>;

  @ApiProperty()
  expiresIn!: number;
}
