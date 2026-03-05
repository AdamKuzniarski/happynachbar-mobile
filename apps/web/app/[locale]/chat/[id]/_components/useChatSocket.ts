"use client";

import * as React from "react";
import { io, type Socket } from "socket.io-client";
import type { Message } from "@/lib/api/chat";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type SocketMessage = Message;

type ChatSocketHandlers = {
  onNewMessage: (msg: SocketMessage) => void;
  onUpdateMessage: (msg: SocketMessage) => void;
};

export function useChatSocket(
  conversationId: string,
  handlers: ChatSocketHandlers,
) {
  const socketRef = React.useRef<Socket | null>(null);

  React.useEffect(() => {
    const socket = io(`${API_BASE_URL}/chat`, {
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("chat:join", { conversationId });
    });

    socket.on("message:new", handlers.onNewMessage);
    socket.on("message:updated", handlers.onUpdateMessage);
    socket.on("message:deleted", handlers.onUpdateMessage);

    return () => {
      socket.off("message:new", handlers.onNewMessage);
      socket.off("message:updated", handlers.onUpdateMessage);
      socket.off("message:deleted", handlers.onUpdateMessage);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [conversationId, handlers.onNewMessage, handlers.onUpdateMessage]);

  const sendMessage = React.useCallback(
    (body: string) => {
      socketRef.current?.emit("message:send", {
        conversationId,
        body,
      });
    },
    [conversationId],
  );

  const editMessage = React.useCallback((messageId: string, body: string) => {
    socketRef.current?.emit("message:edit", {
      messageId,
      body,
    });
  }, []);

  const deleteMessage = React.useCallback((messageId: string) => {
    socketRef.current?.emit("message:delete", { messageId });
  }, []);

  return { sendMessage, editMessage, deleteMessage };
}
