import {
  getConversation,
  getConversationMessages,
  type ConversationListItem,
  type Message,
} from '@/lib/chat';

export type RoomMessage = Message & {
  localId?: string;
  optimistic?: boolean;
};

export function sortMessagesDesc(messages: RoomMessage[]) {
  return messages
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt) || b.id.localeCompare(a.id));
}

export function mergeMessages(messages: RoomMessage[]) {
  return sortMessagesDesc(
    Array.from(new Map(messages.map((message) => [message.id, message])).values()),
  );
}

export function upsertMessage(items: RoomMessage[], message: RoomMessage) {
  return mergeMessages([...items, message]);
}

export function createLocalId() {
  return `local:${Date.now()}:${Math.random().toString(36).slice(2, 9)}`;
}

export function getSocketErrorText(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return 'Socket-Verbindung fehlgeschlagen. Bitte API/Token prüfen.';
}

export function getConversationTitle(item?: ConversationListItem | null) {
  if (!item) return 'Chat';
  if (item.type === 'GROUP') return item.activityTitle?.trim() || 'Gruppenchat';
  return item.participantDisplayName?.trim() || 'Nachbar';
}

export function getConversationSubtitle(item?: ConversationListItem | null) {
  if (!item) return null;
  if (item.type === 'GROUP') return 'Gruppenchat';
  return item.activityTitle?.trim() || 'Direktnachricht';
}

export async function loadRoomData(conversationId: string) {
  const [messagesResponse, conversation] = await Promise.all([
    getConversationMessages(conversationId),
    getConversation(conversationId).catch(() => null),
  ]);

  return {
    items: sortMessagesDesc((messagesResponse.items ?? []) as RoomMessage[]),
    nextCursor: messagesResponse.nextCursor ?? null,
    conversation,
  };
}

export async function loadOlderRoomData(conversationId: string, cursor: string) {
  const response = await getConversationMessages(conversationId, { cursor });

  return {
    items: (response.items ?? []) as RoomMessage[],
    nextCursor: response.nextCursor ?? null,
  };
}

export function createOptimisticMessage(params: {
  conversationId: string;
  currentUserId: string | null;
  body: string;
}): RoomMessage {
  const localId = createLocalId();

  return {
    id: localId,
    localId,
    optimistic: true,
    conversationId: params.conversationId,
    senderId: params.currentUserId ?? 'me',
    senderDisplayName: 'Du',
    body: params.body,
    createdAt: new Date().toISOString(),
    editedAt: null,
    deletedAt: null,
  };
}

export function replaceOptimisticMessage(params: {
  items: RoomMessage[];
  nextMessage: Message;
  currentUserId: string | null;
}) {
  const { items, nextMessage, currentUserId } = params;

  if (!currentUserId || nextMessage.senderId !== currentUserId) {
    return { items, replaced: false, localId: null as string | null };
  }

  const incomingBody = (nextMessage.body ?? '').trim();
  if (!incomingBody) {
    return { items, replaced: false, localId: null as string | null };
  }

  const optimisticItem = items.find(
    (item) => item.optimistic && (item.body ?? '').trim() === incomingBody,
  );

  if (!optimisticItem) {
    return { items, replaced: false, localId: null as string | null };
  }

  return {
    items: mergeMessages([
      ...items.filter((item) => item.id !== optimisticItem.id),
      nextMessage as RoomMessage,
    ]),
    replaced: true,
    localId: optimisticItem.localId ?? null,
  };
}

export function applyLocalEdit(items: RoomMessage[], messageId: string, body: string) {
  return items.map((item) =>
    item.id === messageId
      ? {
          ...item,
          body,
          editedAt: new Date().toISOString(),
        }
      : item,
  );
}

export function applyLocalDelete(items: RoomMessage[], messageId: string) {
  return items.map((item) =>
    item.id === messageId
      ? {
          ...item,
          body: null,
          deletedAt: new Date().toISOString(),
        }
      : item,
  );
}
