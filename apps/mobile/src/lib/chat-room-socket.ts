import { AppState } from 'react-native';
import { io, type Socket } from 'socket.io-client';
import { API_BASE_URL } from '@/lib/api';
import { getAuthToken } from '@/lib/auth-token';
import type { Message } from '@/lib/chat';

type Handlers = {
  onConnect: () => void;
  onDisconnect: () => void;
  onConnectError: (error: unknown) => void;
  onMessageNew: (message: Message) => void;
  onMessageUpdated: (message: Message) => void;
  onMessageDeleted: (message: Message) => void;
};

export async function connectChatRoomSocket(conversationId: string, handlers: Handlers) {
  const token = await getAuthToken();

  const socket = io(`${API_BASE_URL}/chat`, {
    withCredentials: true,
    auth: token ? { token } : undefined,
  });

  socket.on('connect', handlers.onConnect);
  socket.on('disconnect', handlers.onDisconnect);
  socket.on('connect_error', handlers.onConnectError);
  socket.on('message:new', handlers.onMessageNew);
  socket.on('message:updated', handlers.onMessageUpdated);
  socket.on('message:deleted', handlers.onMessageDeleted);

  const appStateSubscription = AppState.addEventListener('change', (nextState) => {
    if (nextState === 'active' && !socket.connected) {
      socket.connect();
    }
  });

  return {
    socket,
    cleanup() {
      appStateSubscription.remove();
      socket.off('connect', handlers.onConnect);
      socket.off('disconnect', handlers.onDisconnect);
      socket.off('connect_error', handlers.onConnectError);
      socket.off('message:new', handlers.onMessageNew);
      socket.off('message:updated', handlers.onMessageUpdated);
      socket.off('message:deleted', handlers.onMessageDeleted);
      socket.disconnect();
    },
  };
}
