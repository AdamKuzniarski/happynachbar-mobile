"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { MessageCircle, MessageCircleMore } from "lucide-react";
import { io, type Socket } from "socket.io-client";
import { getUnreadCount, listConversations } from "@/lib/api/chat";
import { defaultLocale, isLocale } from "@/lib/i18n";
import { useTranslations } from "next-intl";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function ChatUnreadBadge({ className }: { className: string }) {
  const [hasUnread, setHasUnread] = React.useState(false);
  const socketRef = React.useRef<Socket | null>(null);
  const joinedRef = React.useRef<Set<string>>(new Set());
  const params = useParams();
  const t = useTranslations("header");
  const localeParam = params?.locale;
  const locale =
    typeof localeParam === "string" && isLocale(localeParam)
      ? localeParam
      : defaultLocale;

  async function refreshUnread() {
    try {
      const res = await getUnreadCount();
      setHasUnread((res?.count ?? 0) > 0);
    } catch {
      setHasUnread(false);
    }
  }

  async function joinConversations(socket: Socket) {
    const res = await listConversations();
    const items = res?.items ?? [];
    items.forEach((c) => {
      if (joinedRef.current.has(c.id)) return;
      joinedRef.current.add(c.id);
      socket.emit("chat:join", { conversationId: c.id });
    });
  }

  React.useEffect(() => {
    let alive = true;
    refreshUnread();

    const socket = io(`${API_BASE_URL}/chat`, { withCredentials: true });
    socketRef.current = socket;

    socket.on("connect", () => {
      joinConversations(socket).catch(() => {});
    });

    socket.on("message:new", () => {
      refreshUnread();
      window.dispatchEvent(new Event("chat:unread"));
    });

    function handleRead() {
      refreshUnread();
    }

    function handleRefresh() {
      if (socketRef.current) {
        joinConversations(socketRef.current).catch(() => {});
      }
      refreshUnread();
    }

    window.addEventListener("chat:read", handleRead);
    window.addEventListener("chat:refresh", handleRefresh);

    const interval = window.setInterval(() => {
      if (!alive) return;
      refreshUnread();
    }, 20000);

    const joinInterval = window.setInterval(() => {
      if (!alive) return;
      if (socketRef.current) {
        joinConversations(socketRef.current).catch(() => {});
      }
    }, 5000);

    return () => {
      alive = false;
      window.removeEventListener("chat:read", handleRead);
      window.removeEventListener("chat:refresh", handleRefresh);
      window.clearInterval(interval);
      window.clearInterval(joinInterval);
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const glowClass = hasUnread
    ? "!bg-limecream !text-evergreen !border-fern"
    : "";

  return (
    <Link
      href={`/${locale}/chat`}
      className={`${className} ${glowClass}`}
      aria-label={t("chatAria")}
    >
      {hasUnread ? (
        <MessageCircleMore className="h-4 w-4" aria-hidden="true" />
      ) : (
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
      )}
    </Link>
  );
}
