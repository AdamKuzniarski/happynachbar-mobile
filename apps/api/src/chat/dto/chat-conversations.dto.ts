import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ConversationType } from '@prisma/client';

export class ConversationListItemDto {
  @ApiProperty({ example: '1b5f3d0e-1a2b-4c3d-9e0f-123456789abc' })
  id!: string;

  @ApiPropertyOptional({ example: '1b5f3d0e-1a2b-4c3d-9e0f-123456789abc' })
  participantId!: string | null;

  @ApiPropertyOptional({ example: 'Neighbor' })
  participantDisplayName!: string | null;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png', nullable: true })
  participantAvatarUrl!: string | null;

  @ApiProperty({
    example: '1b5f3d0e-1a2b-4c3d-9e0f-123456789abc',
    nullable: true,
  })
  activityId!: string | null;

  @ApiProperty({ example: 'Gemeinsamer Spaziergang', nullable: true })
  activityTitle!: string | null;

  @ApiProperty({ enum: ConversationType, example: ConversationType.DIRECT })
  type!: ConversationType;

  @ApiProperty({ example: true })
  hasUnread!: boolean;

  @ApiProperty({ example: 'Letzte Nachricht', nullable: true })
  lastMessageBody!: string | null;

  @ApiProperty({ example: '2026-01-30T12:00:00.000Z', nullable: true })
  lastMessageAt!: string | null;
}

export class ListConversationsResponseDto {
  @ApiProperty({ type: () => [ConversationListItemDto] })
  items!: ConversationListItemDto[];
}
