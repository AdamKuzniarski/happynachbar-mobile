import { apiFetch } from "./client";

export type ConversationListItem = {
  id: string;
  participantId: string | null;
  participantDisplayName: string | null;
  participantAvatarUrl: string | null;
  activityId: string | null;
  activityTitle: string | null;
  type: "DIRECT" | "GROUP";
  hasUnread: boolean;
  lastMessageBody: string | null;
  lastMessageAt: string | null;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  senderDisplayName?: string | null;
  body: string | null;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
};

const CONVERSATIONS_CACHE_TTL_MS = 5000;
let conversationsCache:
  | { data: { items: ConversationListItem[] }; ts: number }
  | null = null;
let conversationsInFlight:
  | Promise<{ items: ConversationListItem[] } | undefined>
  | null = null;

export async function listConversations({
  force = false,
}: { force?: boolean } = {}) {
  const now = Date.now();
  if (
    !force &&
    conversationsCache &&
    now - conversationsCache.ts < CONVERSATIONS_CACHE_TTL_MS
  ) {
    return conversationsCache.data;
  }

  if (!force && conversationsInFlight) return conversationsInFlight;

  const req = apiFetch<{ items: ConversationListItem[] }>("/chat/conversations");
  conversationsInFlight = req;
  try {
    const data = (await req) ?? { items: [] };
    conversationsCache = { data, ts: Date.now() };
    return data;
  } finally {
    conversationsInFlight = null;
  }
}

export async function listMessages(conversationId: string) {
  return apiFetch<{ items: Message[]; nextCursor: string | null }>(
    `/chat/conversations/${encodeURIComponent(conversationId)}/messages`,
  );
}

export async function getConversation(conversationId: string) {
  const now = Date.now();
  if (
    conversationsCache &&
    now - conversationsCache.ts < CONVERSATIONS_CACHE_TTL_MS
  ) {
    const cached = conversationsCache.data.items.find(
      (c) => c.id === conversationId,
    );
    if (cached) return cached;
  }
  return apiFetch<ConversationListItem>(
    `/chat/conversations/${encodeURIComponent(conversationId)}`,
  );
}

export async function markConversationRead(conversationId: string) {
  return apiFetch(`/chat/conversations/${encodeURIComponent(conversationId)}/read`, {
    method: "POST",
  });
}

export async function getUnreadCount() {
  return apiFetch<{ count: number }>(`/chat/unread-count`);
}

export async function openGroupChat(activityId: string) {
  try {
    const convo = await apiFetch<{ id?: string }>(
      `/chat/conversations/group/${encodeURIComponent(activityId)}`,
      { method: "POST" },
    );
    if (!convo?.id) {
      return { ok: false as const, message: "Invalid response" };
    }
    return { ok: true as const, id: convo.id };
  } catch (e: unknown) {
    return {
      ok: false as const,
      message: e instanceof Error ? e.message : "Unknown error",
    };
  }
}
