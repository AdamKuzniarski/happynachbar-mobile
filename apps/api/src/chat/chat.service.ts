import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  ChatMessagesQueryDto,
  ListMessagesResponseDto,
  MessageDto,
} from './dto/chat-messages.dto';
import {
  ConversationListItemDto,
  ListConversationsResponseDto,
} from './dto/chat-conversations.dto';
import { UnreadCountDto } from './dto/chat-unread.dto';

function sortPair(a: string, b: string) {
  return a < b ? [a, b] : [b, a];
}

const conversationInclude = {
  participantA: {
    select: {
      id: true,
      profile: { select: { displayName: true, avatarUrl: true } },
    },
  },
  participantB: {
    select: {
      id: true,
      profile: { select: { displayName: true, avatarUrl: true } },
    },
  },
  messages: {
    take: 1,
    orderBy: { createdAt: 'desc' },
    select: {
      body: true,
      createdAt: true,
      senderId: true,
      deletedAt: true,
    },
  },
  reads: {
    take: 1,
    select: { lastReadAt: true },
  },
  activity: {
    select: { title: true },
  },
} as const;

type ConversationRow = Prisma.ConversationGetPayload<{
  include: typeof conversationInclude;
}>;

type MessageWithMeta = Prisma.MessageGetPayload<{
  select: {
    id: true;
    conversationId: true;
    senderId: true;
    body: true;
    createdAt: true;
    editedAt: true;
    deletedAt: true;
  };
}>;

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  private toMessageDto(message: {
    id: string;
    conversationId: string;
    senderId: string;
    body: string;
    createdAt: Date;
    editedAt?: Date | null;
    deletedAt?: Date | null;
    senderDisplayName?: string | null;
  }): MessageDto {
    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      senderDisplayName: message.senderDisplayName ?? null,
      body: message.deletedAt ? null : message.body,
      createdAt: message.createdAt.toISOString(),
      editedAt: message.editedAt ? message.editedAt.toISOString() : null,
      deletedAt: message.deletedAt ? message.deletedAt.toISOString() : null,
    };
  }

  private async touchRead(userId: string, conversationId: string) {
    await this.prisma.conversationRead.upsert({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      update: { lastReadAt: new Date() },
      create: { conversationId, userId, lastReadAt: new Date() },
    });
  }

  private async listConversationRows(
    userId: string,
  ): Promise<ConversationRow[]> {
    return this.prisma.conversation.findMany({
      where: {
        OR: [
          {
            type: 'DIRECT',
            OR: [{ participantAId: userId }, { participantBId: userId }],
          },
          {
            type: 'GROUP',
            participants: { some: { userId } },
          },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        ...conversationInclude,
        reads: {
          where: { userId },
          take: 1,
          select: { lastReadAt: true },
        },
      },
    });
  }

  private toConversationListItem(
    userId: string,
    c: ConversationRow,
  ): ConversationListItemDto {
    const isGroup = c.type === 'GROUP';
    const other = c.participantAId === userId ? c.participantB : c.participantA;
    const last = c.messages[0];
    const lastReadAt = c.reads[0]?.lastReadAt;
    const hasUnread =
      !!last &&
      last.senderId !== userId &&
      (!lastReadAt || last.createdAt > lastReadAt);
    return {
      id: c.id,
      participantId: isGroup ? null : other.id,
      participantDisplayName: isGroup
        ? (c.activity?.title ?? 'Activity chat')
        : (other.profile?.displayName ?? 'Neighbor'),
      participantAvatarUrl: isGroup ? null : (other.profile?.avatarUrl ?? null),
      activityId: c.activityId,
      activityTitle: c.activity?.title ?? null,
      type: c.type,
      hasUnread,
      lastMessageBody: last
        ? last.deletedAt
          ? 'Nachricht gelöscht'
          : last.body
        : null,
      lastMessageAt: last?.createdAt ? last.createdAt.toISOString() : null,
    };
  }

  async assertConversationAccess(userId: string, conversationId: string) {
    const convo = await this.prisma.conversation.findFirst({
      where: { id: conversationId },
      select: {
        id: true,
        type: true,
        participantAId: true,
        participantBId: true,
      },
    });

    if (!convo) throw new NotFoundException('Conversation not found');
    if (convo.type === 'DIRECT') {
      if (convo.participantAId !== userId && convo.participantBId !== userId) {
        throw new NotFoundException('Conversation not found');
      }
      return;
    }

    const member = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId } },
      select: { id: true },
    });

    if (!member) throw new NotFoundException('Conversation not found');
  }

  async createOrGetByActivity(userId: string, activityId: string) {
    const activity = await this.prisma.activity.findFirst({
      where: { id: activityId, status: 'ACTIVE' },
      select: { createdById: true },
    });

    if (!activity) throw new NotFoundException('Activity not found');
    if (activity.createdById === userId) {
      throw new BadRequestException('Cannot start a chat with yourself');
    }

    const [participantAId, participantBId] = sortPair(
      userId,
      activity.createdById,
    );

    const conversation = await this.prisma.conversation.upsert({
      where: {
        participantAId_participantBId_activityId: {
          participantAId,
          participantBId,
          activityId,
        },
      },
      update: {},
      create: {
        participantAId,
        participantBId,
        activityId,
        type: 'DIRECT',
      },
    });

    return conversation;
  }

  async createOrGetByUser(userId: string, otherUserId: string) {
    if (userId === otherUserId) {
      throw new BadRequestException('Cannot start a chat with yourself');
    }

    const other = await this.prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true },
    });
    if (!other) throw new NotFoundException('User not found');

    const [participantAId, participantBId] = sortPair(userId, otherUserId);

    const existing = await this.prisma.conversation.findFirst({
      where: {
        participantAId,
        participantBId,
        activityId: null,
        type: 'DIRECT',
      },
      select: { id: true },
    });

    if (existing) return existing;

    return this.prisma.conversation.create({
      data: {
        participantAId,
        participantBId,
        activityId: null,
        type: 'DIRECT',
      },
      select: { id: true },
    });
  }

  async createOrGetGroupByActivity(userId: string, activityId: string) {
    const activity = await this.prisma.activity.findFirst({
      where: { id: activityId, status: 'ACTIVE' },
      select: { id: true, createdById: true },
    });

    if (!activity) throw new NotFoundException('Activity not found');

    const isParticipant = await this.prisma.activityParticipant.findFirst({
      where: { activityId, userId },
      select: { id: true },
    });

    if (!isParticipant && activity.createdById !== userId) {
      throw new ForbiddenException('Not allowed');
    }

    let conversation = await this.prisma.conversation.findFirst({
      where: { activityId, type: 'GROUP' },
      select: { id: true },
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: {
          activityId,
          type: 'GROUP',
          participantAId: activity.createdById,
          participantBId: activity.createdById,
          participants: {
            create: [
              { userId: activity.createdById },
              ...(userId === activity.createdById ? [] : [{ userId }]),
            ],
          },
        },
        select: { id: true },
      });

      return conversation;
    }

    await this.prisma.conversationParticipant.upsert({
      where: {
        conversationId_userId: { conversationId: conversation.id, userId },
      },
      update: {},
      create: { conversationId: conversation.id, userId },
    });

    return conversation;
  }

  async listMessages(
    userId: string,
    conversationId: string,
    q: ChatMessagesQueryDto,
  ): Promise<ListMessagesResponseDto> {
    await this.assertConversationAccess(userId, conversationId);
    void q;

    const rows = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        User: { select: { profile: { select: { displayName: true } } } },
      },
    });

    const items = rows.map((m) =>
      this.toMessageDto({
        id: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        body: m.body,
        createdAt: m.createdAt,
        editedAt: m.editedAt,
        deletedAt: m.deletedAt,
        senderDisplayName: m.User?.profile?.displayName ?? null,
      }),
    );

    await this.touchRead(userId, conversationId);

    return { items, nextCursor: null };
  }

  async createMessage(
    userId: string,
    conversationId: string,
    body: string,
  ): Promise<MessageDto> {
    await this.assertConversationAccess(userId, conversationId);

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: { conversationId, senderId: userId, body },
        include: {
          User: { select: { profile: { select: { displayName: true } } } },
        },
      }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);

    return this.toMessageDto({
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      body: message.body,
      createdAt: message.createdAt,
      editedAt: message.editedAt,
      deletedAt: message.deletedAt,
      senderDisplayName: message.User?.profile?.displayName ?? null,
    });
  }

  async listConversations(
    userId: string,
  ): Promise<ListConversationsResponseDto> {
    const conversations = await this.listConversationRows(userId);

    const items = conversations.map((c) =>
      this.toConversationListItem(userId, c),
    );

    return { items };
  }

  async getConversation(
    userId: string,
    conversationId: string,
  ): Promise<ConversationListItemDto> {
    await this.assertConversationAccess(userId, conversationId);
    const convo = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        ...conversationInclude,
        reads: {
          where: { userId },
          take: 1,
          select: { lastReadAt: true },
        },
      },
    });

    if (!convo) throw new NotFoundException('Conversation not found');

    return this.toConversationListItem(userId, convo);
  }

  async markRead(userId: string, conversationId: string) {
    await this.assertConversationAccess(userId, conversationId);
    await this.touchRead(userId, conversationId);
    return { ok: true };
  }

  async getUnreadCount(userId: string): Promise<UnreadCountDto> {
    const conversations = await this.listConversationRows(userId);

    const count = conversations.filter((c) => {
      const last = c.messages[0];
      if (!last) return false;
      if (last.senderId === userId) return false;
      const lastReadAt = c.reads[0]?.lastReadAt;
      if (!lastReadAt) return true;
      return last.createdAt > lastReadAt;
    }).length;

    return { count };
  }

  async editMessage(
    userId: string,
    messageId: string,
    body: string,
  ): Promise<MessageDto> {
    const message: MessageWithMeta | null =
      await this.prisma.message.findUnique({
        where: { id: messageId },
        select: {
          id: true,
          conversationId: true,
          senderId: true,
          body: true,
          createdAt: true,
          editedAt: true,
          deletedAt: true,
        },
      });

    if (!message) throw new NotFoundException('Message not found');
    await this.assertConversationAccess(userId, message.conversationId);
    if (message.senderId !== userId) {
      throw new ForbiddenException('Cannot edit this message');
    }
    if (message.deletedAt) {
      throw new BadRequestException('Message already deleted');
    }

    const nextBody = body.trim();
    if (!nextBody) throw new BadRequestException('Message cannot be empty');

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: { body: nextBody, editedAt: new Date() },
      include: {
        User: { select: { profile: { select: { displayName: true } } } },
      },
    });

    return this.toMessageDto({
      id: updated.id,
      conversationId: updated.conversationId,
      senderId: updated.senderId,
      body: updated.body,
      createdAt: updated.createdAt,
      editedAt: updated.editedAt,
      deletedAt: updated.deletedAt,
      senderDisplayName: updated.User?.profile?.displayName ?? null,
    });
  }

  async deleteMessage(userId: string, messageId: string): Promise<MessageDto> {
    const message: MessageWithMeta | null =
      await this.prisma.message.findUnique({
        where: { id: messageId },
        select: {
          id: true,
          conversationId: true,
          senderId: true,
          body: true,
          createdAt: true,
          editedAt: true,
          deletedAt: true,
        },
      });

    if (!message) throw new NotFoundException('Message not found');
    await this.assertConversationAccess(userId, message.conversationId);
    if (message.senderId !== userId) {
      throw new ForbiddenException('Cannot delete this message');
    }

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: message.deletedAt ?? new Date() },
      include: {
        User: { select: { profile: { select: { displayName: true } } } },
      },
    });

    return this.toMessageDto({
      id: updated.id,
      conversationId: updated.conversationId,
      senderId: updated.senderId,
      body: updated.body,
      createdAt: updated.createdAt,
      editedAt: updated.editedAt,
      deletedAt: updated.deletedAt,
      senderDisplayName: updated.User?.profile?.displayName ?? null,
    });
  }
}
