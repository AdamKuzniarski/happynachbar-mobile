import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { DefaultEventsMap, Server, Socket } from 'socket.io';
import type { MessageDto } from './dto/chat-messages.dto';
import { ChatService } from './chat.service';

const COOKIE_NAME = 'happynachbar_token';

type JwtPayload = {
  sub: string;
  email?: string;
  role?: string;
  exp?: number;
  iat?: number;
};

type AuthedSocket = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  { userId?: string }
>;

function parseCookie(header?: string): Record<string, string> {
  if (!header) return {};
  return header
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((acc, part) => {
      const idx = part.indexOf('=');
      if (idx === -1) return acc;
      const key = part.slice(0, idx).trim();
      const value = part.slice(idx + 1).trim();
      if (key) acc[key] = value;
      return acc;
    }, {});
}

function parseOrigins(raw?: string) {
  return new Set(
    (raw ?? 'http://localhost:3000')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );
}

function getBearerFromHeader(raw?: string) {
  if (!raw) return null;
  const prefix = 'Bearer ';
  if (!raw.startsWith(prefix)) return null;
  const token = raw.slice(prefix.length).trim();
  return token.length > 0 ? token : null;
}

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: true, credentials: true },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly allowedOrigins: Set<string>;

  constructor(
    private config: ConfigService,
    private jwt: JwtService,
    private chat: ChatService,
  ) {
    this.allowedOrigins = parseOrigins(this.config.get<string>('CORS_ORIGINS'));
  }

  async handleConnection(client: AuthedSocket) {
    const origin = client.handshake.headers.origin;
    if (origin && !this.allowedOrigins.has(origin)) {
      client.disconnect(true);
      return;
    }

    const cookies = parseCookie(client.handshake.headers.cookie);
    const tokenFromAuth =
      typeof client.handshake.auth?.token === 'string'
        ? client.handshake.auth.token.trim()
        : '';
    const tokenFromHeader = getBearerFromHeader(
      typeof client.handshake.headers.authorization === 'string'
        ? client.handshake.headers.authorization
        : undefined,
    );
    const tokenFromCookie = cookies[COOKIE_NAME];
    const token = tokenFromAuth || tokenFromHeader || tokenFromCookie;

    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token);
      client.data.userId = payload.sub;
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect() {}

  @SubscribeMessage('chat:join')
  async handleJoin(client: AuthedSocket, payload: { conversationId?: string }) {
    const userId = client.data.userId;
    if (!userId) {
      client.disconnect(true);
      return;
    }

    const conversationId =
      typeof payload?.conversationId === 'string' ? payload.conversationId : '';
    if (!conversationId) return;

    await this.chat.assertConversationAccess(userId, conversationId);
    await client.join(`conversation:${conversationId}`);
    client.emit('chat:joined', { conversationId });
  }

  @SubscribeMessage('message:send')
  async handleSend(
    client: AuthedSocket,
    payload: { conversationId?: string; body?: string },
  ) {
    const userId = client.data.userId;
    if (!userId) {
      client.disconnect(true);
      return;
    }

    const conversationId =
      typeof payload?.conversationId === 'string' ? payload.conversationId : '';
    const body = typeof payload?.body === 'string' ? payload.body.trim() : '';
    if (!conversationId || !body) return;

    const message: MessageDto = await this.chat.createMessage(
      userId,
      conversationId,
      body,
    );
    this.server
      .to(`conversation:${conversationId}`)
      .emit('message:new', message);
  }

  @SubscribeMessage('message:edit')
  async handleEdit(
    client: AuthedSocket,
    payload: { messageId?: string; body?: string },
  ) {
    const userId = client.data.userId;
    if (!userId) {
      client.disconnect(true);
      return;
    }

    const messageId =
      typeof payload?.messageId === 'string' ? payload.messageId : '';
    const body = typeof payload?.body === 'string' ? payload.body.trim() : '';
    if (!messageId || !body) return;

    const message = await this.chat.editMessage(userId, messageId, body);
    this.server
      .to(`conversation:${message.conversationId}`)
      .emit('message:updated', message);
  }

  @SubscribeMessage('message:delete')
  async handleDelete(client: AuthedSocket, payload: { messageId?: string }) {
    const userId = client.data.userId;
    if (!userId) {
      client.disconnect(true);
      return;
    }

    const messageId =
      typeof payload?.messageId === 'string' ? payload.messageId : '';
    if (!messageId) return;

    const message = await this.chat.deleteMessage(userId, messageId);
    this.server
      .to(`conversation:${message.conversationId}`)
      .emit('message:deleted', message);
  }
}
