import type { ConversationListItem, Message } from '@/lib/chat';

export type RoomMessage = Message & {
  localId: string;
  optimistic?: boolean;
};

export function sortMessagesDesc(messages: RoomMessage[]) {
  return messages
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(b.createdAt) || b.id.localeCompare(a.id));
}

export function mergeMessages(messages: RoomMessage[]) {
  return sortMessagesDesc(
    Array.from(new Map(messages.map((message) => [message.id, message])).values()),
  );
}

export function upsertMessage(items: RoomMessage[], messages: RoomMessage) {
  return mergeMessages([...items, messages]);
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
  return 'Socket-Verbindung fehlgeschlagen. Bitter API/Token prüfen.';
}

export function getConversationTitle(item?: ConversationListItem | null) {
  if (!item) return 'Chat';
  if (item.type === 'GROUP') return item.activityTitle?.trim() || 'Gruppenchat';
  return item.activityTitle?.trim() || 'Direktnachricht';
}
