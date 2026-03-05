import { ApiProperty } from '@nestjs/swagger';
import { ConversationType } from '@prisma/client';

export class ConversationDto {
  @ApiProperty({ example: '1b5f3d0e-1a2b-4c3d-9e0f-123456789abc' })
  id!: string;

  @ApiProperty({ example: '1b5f3d0e-1a2b-4c3d-9e0f-123456789abc' })
  participantAId!: string;

  @ApiProperty({ example: '1b5f3d0e-1a2b-4c3d-9e0f-123456789abc' })
  participantBId!: string;

  @ApiProperty({
    example: '1b5f3d0e-1a2b-4c3d-9e0f-123456789abc',
    nullable: true,
  })
  activityId!: string | null;

  @ApiProperty({ example: '2026-01-30T12:00:00.000Z' })
  createdAt!: string;

  @ApiProperty({ example: '2026-01-30T12:00:00.000Z' })
  updatedAt!: string;

  @ApiProperty({ enum: ConversationType, example: ConversationType.DIRECT })
  type!: ConversationType;
}
