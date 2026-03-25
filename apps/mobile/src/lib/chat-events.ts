type ChatEventName =
  | 'chat:refresh'
  | 'chat:read'
  | 'chat:message:new'
  | 'chat:message:updated'
  | 'chat:message:deleted';

type ChatEventPayload = {
  conversationId?: string;
};

type ChatEventListener = (payload: ChatEventPayload) => void;

const listeners = new Map<ChatEventName, Set<ChatEventListener>>();

export function emitChatEvent(name: ChatEventName, payload: ChatEventPayload = {}) {
  const group = listeners.get(name);
  if (!group) return;

  for (const listener of group) {
    listener(payload);
  }
}

export function onChatEvent(name: ChatEventName, listener: ChatEventListener) {
  const group = listeners.get(name) ?? new Set<ChatEventListener>();
  group.add(listener);
  listeners.set(name, group);

  return () => {
    const current = listeners.get(name);
    if (!current) return;
    current.delete(listener);
    if (current.size === 0) {
      listeners.delete(name);
    }
  };
}
