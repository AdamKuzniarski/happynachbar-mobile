"use client";

import * as React from "react";
import { ArrowUpRight, Pencil, Trash2, User } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  getConversation,
  listMessages,
  markConversationRead,
  type Message,
} from "@/lib/api/chat";
import { FormError } from "@/components/ui/FormError";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useChatSocket } from "./useChatSocket";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function ChatRoom({ conversationId }: { conversationId: string }) {
  const locale = useLocale();
  const t = useTranslations("chat");
  const tCommon = useTranslations("common");
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [text, setText] = React.useState("");
  const [participantId, setParticipantId] = React.useState<string | null>(null);
  const [participantName, setParticipantName] = React.useState<string | null>(
    null,
  );
  const [activityTitle, setActivityTitle] = React.useState<string | null>(null);
  const [activityId, setActivityId] = React.useState<string | null>(null);
  const [conversationType, setConversationType] = React.useState<
    "DIRECT" | "GROUP" | null
  >(null);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingText, setEditingText] = React.useState("");
  const bottomRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      const [messagesRes, conversationRes, meRes] = await Promise.allSettled([
        listMessages(conversationId),
        getConversation(conversationId),
        fetch(`${API_BASE_URL}/users/me`, { credentials: "include" }).then(
          (res) => (res.ok ? res.json() : null),
        ),
      ]);

      if (!alive) return;

      if (messagesRes.status === "fulfilled") {
        const items = messagesRes.value?.items ?? [];
        setMessages(items.slice().reverse());
        markConversationRead(conversationId)
          .then(() => {
            window.dispatchEvent(new Event("chat:read"));
          })
          .catch(() => {});
      } else {
        const msg =
          messagesRes.reason instanceof Error
            ? messagesRes.reason.message
            : t("errors.unknown");
        setError(msg);
      }

      if (conversationRes.status === "fulfilled") {
        const item = conversationRes.value;
        setParticipantId(item?.participantId ?? null);
        setParticipantName(item?.participantDisplayName ?? null);
        setActivityTitle(item?.activityTitle ?? null);
        setActivityId(item?.activityId ?? null);
        setConversationType(item?.type ?? null);
      } else {
        setParticipantId(null);
        setParticipantName(null);
        setActivityTitle(null);
        setActivityId(null);
        setConversationType(null);
      }

      if (meRes.status === "fulfilled") {
        const id = typeof meRes.value?.id === "string" ? meRes.value.id : null;
        setCurrentUserId(id);
      } else {
        setCurrentUserId(null);
      }

      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [conversationId, t]);

  const handleNewMessage = React.useCallback(
    (msg: Message) => {
      if (msg.conversationId !== conversationId) return;
      setMessages((prev) => [...prev, msg]);
      markConversationRead(conversationId)
        .then(() => {
          window.dispatchEvent(new Event("chat:read"));
        })
        .catch(() => {});
    },
    [conversationId],
  );

  const handleMessageUpdate = React.useCallback(
    (msg: Message) => {
      if (msg.conversationId !== conversationId) return;
      setMessages((prev) =>
        prev.map((item) => (item.id === msg.id ? msg : item)),
      );
    },
    [conversationId],
  );

  const { sendMessage, editMessage, deleteMessage: emitDeleteMessage } =
    useChatSocket(conversationId, {
      onNewMessage: handleNewMessage,
      onUpdateMessage: handleMessageUpdate,
    });

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, loading]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body) return;
    sendMessage(body);
    setText("");
  }

  function startEdit(message: Message) {
    if (!message.body) return;
    setEditingId(message.id);
    setEditingText(message.body);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingText("");
  }

  function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    const body = editingText.trim();
    if (!body) return;
    editMessage(editingId, body);
    cancelEdit();
  }

  function deleteMessage(messageId: string) {
    if (!window.confirm(t("confirmDelete"))) return;
    emitDeleteMessage(messageId);
    if (editingId === messageId) cancelEdit();
  }

  return (
    <>
      <h1 className="text-lg font-semibold text-center">
        {conversationType === "GROUP" ? (
          t("groupChat")
        ) : participantId && participantName?.trim() ? (
          <span>
            {t("chatWith", { name: "" }).trim()}{" "}
            <Link
              href={`/${locale}/users/${encodeURIComponent(participantId)}`}
              className="inline-flex items-center gap-1 rounded-md px-1 text-foreground/90 hover:bg-fern/10 hover:text-foreground"
            >
              <User className="h-4 w-4" aria-hidden="true" />
              {participantName}
            </Link>
          </span>
        ) : (
          t("chatWith", {
            name: participantName?.trim() ? participantName : t("creator"),
          })
        )}
        {activityTitle?.trim() ? (
          <span className="mt-1 block text-sm font-normal opacity-75">
            {conversationType === "GROUP" && activityId ? (
              <span className="inline-flex items-center gap-2 text-foreground/80 hover:text-foreground">
                {t("activityTitle", { title: "" })}
                <Link
                  href={`/${locale}/activities/${encodeURIComponent(
                    activityId,
                  )}`}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-foreground/90 hover:bg-fern/10"
                >
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  {activityTitle}
                </Link>
              </span>
            ) : (
              t("activityTitle", { title: activityTitle })
            )}
          </span>
        ) : null}
      </h1>
      <section className="mt-3 rounded-2xl bg-surface/60 p-4 shadow-sm ring-1 ring-fern/25">
        <FormError message={error} />

      {loading ? (
        <p className="mt-4 text-sm opacity-70">{tCommon("loading")}</p>
      ) : (
        <div className="mt-4 space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          {messages.length === 0 ? (
            <p className="text-sm opacity-70">{t("emptyMessages")}</p>
          ) : (
            messages.map((m) => {
              const isMine = !!currentUserId && m.senderId === currentUserId;
              const authorLabel = isMine
                ? t("you")
                : conversationType === "GROUP"
                  ? m.senderDisplayName?.trim() || t("neighbor")
                  : participantName?.trim() || t("creator");
              const alignment = isMine ? "ml-auto text-right" : "mr-auto text-left";
              const bubble =
                isMine
                  ? "bg-fern text-limecream"
                  : "bg-surface-strong text-foreground";
              const isEditing = editingId === m.id;
              const canEdit = isMine && !m.deletedAt;

              return (
                <div key={m.id} className={alignment}>
                  <div
                    className={`inline-block max-w-[85%] rounded-xl px-3 py-2 text-sm ${bubble}`}
                  >
                    <div
                      className={`flex w-full items-center gap-2 text-[11px] opacity-80 ${
                        isMine ? "justify-end" : "justify-start"
                      }`}
                    >
                      <span>{authorLabel}</span>
                      <span>
                        {new Date(m.createdAt).toLocaleDateString(locale)}{" "}
                        {new Date(m.createdAt).toLocaleTimeString(locale, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {m.editedAt && !m.deletedAt ? (
                        <span className="italic opacity-80">
                          {t("edited")}
                        </span>
                      ) : null}
                      {canEdit ? (
                        <>
                          <button
                            type="button"
                            className="opacity-80 hover:opacity-100"
                            onClick={() => startEdit(m)}
                            aria-label={t("editMessageAria")}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            className="opacity-80 hover:opacity-100"
                            onClick={() => deleteMessage(m.id)}
                            aria-label={t("deleteMessageAria")}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      ) : null}
                    </div>
                    {m.deletedAt ? (
                      <div className="mt-1 italic opacity-80">
                        {t("messageDeleted")}
                      </div>
                    ) : isEditing ? (
                      <form onSubmit={submitEdit} className="mt-2 space-y-1">
                        <Input
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") {
                              e.preventDefault();
                              cancelEdit();
                            }
                          }}
                          autoFocus
                        />
                        <div className="text-[11px] opacity-70">
                          {t("editHints")}{" "}
                          <button
                            type="submit"
                            className="underline hover:opacity-100"
                          >
                            {t("save")}
                          </button>{" "}
                          ·{" "}
                          <button
                            type="button"
                            className="underline hover:opacity-100"
                            onClick={cancelEdit}
                          >
                            {t("cancel")}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="mt-1 break-words">{m.body}</div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      )}

        <form onSubmit={onSubmit} className="mt-4 flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("messagePlaceholder")}
          />
          <Button type="submit">{t("send")}</Button>
        </form>
      </section>
    </>
  );
}
