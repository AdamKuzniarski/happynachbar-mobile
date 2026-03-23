import { apiRequest, type ApiRequestOptions } from '@/lib/api';
import { getAuthToken } from '@/lib/auth-token';

export type ConversationType = 'DIRECT' | 'GROUP';

export type ConversationListItem = {
  id: string;
  participantId: string | null;
  participantDisplayName: string | null;
  participantAvatarUrl: string | null;
  activityId: string | null;
  activityTitle: string | null;
  type: ConversationType;
  hasUnread: boolean;
  lastMessageBody: string | null;
  lastMessageAt: string | null;
};

export type ConversationListResponse = {
  items: ConversationListItem[];
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  senderDisplayName: string | null;
  body: string | null;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
};

export type MessageListResponse = {
  items: Message[];
  nextCursor: string | null;
};

export type SocketEmitter = {
  emit: (event: string, payload: unknown) => void;
};

const CHAT_EVENTS = {
  SEND: 'message:send',
  EDIT: 'message:edit',
  DELETE: 'message:delete',
} as const;

async function authedRequest<TResponse>(path: string, options: ApiRequestOptions = {}) {
  const token = await getAuthToken();
  const mergedHeaders: Record<string, string> = {
    ...(options.headers ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  return apiRequest<TResponse>(path, {
    ...options,
    headers: mergedHeaders,
  });
}

function withQuery(path: string, params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    search.set(key, String(value));
  }

  return search.size > 0 ? `${path}?${search.toString()}` : path;
}

export function getConversations() {
  return authedRequest<ConversationListResponse>('/chat/conversations');
}

export function getConversationMessages(
  conversationId: string,
  options: { cursor?: string; take?: number } = {},
) {
  return authedRequest<MessageListResponse>(
    withQuery(`/chat/conversations/${encodeURIComponent(conversationId)}/messages`, {
      cursor: options.cursor,
      take: options.take,
    }),
  );
}

export function getUnreadCount() {
  return authedRequest<{ count: number }>('/chat/unread-count');
}

export function markConversationAsRead(conversationId: string) {
  return authedRequest<{ ok: boolean }>(`/chat/conversations/${encodeURIComponent(conversationId)}/read`, {
    method: 'POST',
  });
}

export function openGroupConversation(activityId: string) {
  return authedRequest<{ id: string }>(
    `/chat/conversations/group/${encodeURIComponent(activityId)}`,
    { method: 'POST' },
  );
}

export function emitSendMessage(socket: SocketEmitter, conversationId: string, body: string) {
  socket.emit(CHAT_EVENTS.SEND, {
    conversationId,
    body,
  });
}

export function emitEditMessage(socket: SocketEmitter, messageId: string, body: string) {
  socket.emit(CHAT_EVENTS.EDIT, {
    messageId,
    body,
  });
}

export function emitDeleteMessage(socket: SocketEmitter, messageId: string) {
  socket.emit(CHAT_EVENTS.DELETE, {
    messageId,
  });
}
