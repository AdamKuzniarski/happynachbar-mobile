import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class ChatMessagesQueryDto {
  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  take?: number;

  @ApiPropertyOptional({
    example: '1b5f3d0e-1a2b-4c3d-9e0f-123456789abc',
    format: 'uuid',
  })
  @IsOptional()
  @IsString()
  cursor?: string;
}

export class MessageDto {
  @ApiProperty({ example: '1b5f3d0e-1a2b-4c3d-9e0f-123456789abc' })
  id!: string;

  @ApiProperty({ example: '1b5f3d0e-1a2b-4c3d-9e0f-123456789abc' })
  conversationId!: string;

  @ApiProperty({ example: '1b5f3d0e-1a2b-4c3d-9e0f-123456789abc' })
  senderId!: string;

  @ApiPropertyOptional({ example: 'Neighbor', nullable: true })
  senderDisplayName!: string | null;

  @ApiPropertyOptional({
    example: 'Hallo!',
    nullable: true,
    description: 'Null if the message has been deleted.',
  })
  body!: string | null;

  @ApiPropertyOptional({ example: '2026-01-30T12:05:00.000Z', nullable: true })
  editedAt!: string | null;

  @ApiPropertyOptional({ example: '2026-01-30T12:10:00.000Z', nullable: true })
  deletedAt!: string | null;

  @ApiProperty({ example: '2026-01-30T12:00:00.000Z' })
  createdAt!: string;
}

export class EditMessageDto {
  @ApiProperty({ example: 'Aktualisierter Text' })
  @IsString()
  @MinLength(1)
  body!: string;
}

export class ListMessagesResponseDto {
  @ApiProperty({ type: () => [MessageDto] })
  items!: MessageDto[];

  @ApiProperty({
    example: null,
    nullable: true,
    type: String,
    description: 'If null => no more pages',
  })
  nextCursor!: string | null;
}
