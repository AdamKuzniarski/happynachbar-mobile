"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { FormError } from "@/components/ui/FormError";
import { formatDate } from "@/lib/format";
import {
  adminCreateUserWarning,
  adminListUserWarnings,
  type AdminUserWarning,
  type WarningSeverity,
} from "@/lib/api/admin/users";

export function UserWarningsModal({
  open,
  userId,
  userEmail,
  onClose,
}: {
  open: boolean;
  userId: string | null;
  userEmail: string | null;
  onClose: () => void;
}) {
  const [items, setItems] = React.useState<AdminUserWarning[]>([]);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);

  const [loading, setLoading] = React.useState(false);
  const [mutating, setMutating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [severity, setSeverity] = React.useState<WarningSeverity>("LOW");
  const [message, setMessage] = React.useState("");
  const [expiresIn, setExpiresIn] = React.useState<"none" | "7" | "30">("none");

  const isSeverityValue = (value: string): value is WarningSeverity =>
    value === "LOW" || value === "MEDIUM" || value === "HIGH";

  const isExpiresInValue = (value: string): value is "none" | "7" | "30" =>
    value === "none" || value === "7" || value === "30";

  async function load(reset: boolean) {
    if (!userId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await adminListUserWarnings(userId, {
        take: 20,
        cursor: reset ? null : nextCursor,
      });

      const newItems = res?.items ?? [];
      const cursor = res?.nextCursor ?? null;

      setItems((prev) => (reset ? newItems : [...prev, ...newItems]));
      setNextCursor(cursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function create() {
    if (!userId) return;
    setMutating(true);
    setError(null);

    try {
      const expiresAt =
        expiresIn === "none"
          ? undefined
          : new Date(
              Date.now() + Number(expiresIn) * 24 * 60 * 60 * 1000,
            ).toISOString();

      await adminCreateUserWarning(userId, {
        message: message.trim(),
        severity,
        expiresAt,
      });

      setMessage("");
      setExpiresIn("none");
      setSeverity("LOW");
      await load(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setMutating(false);
    }
  }

  React.useEffect(() => {
    if (!open) return;
    setItems([]);
    setNextCursor(null);
    setError(null);
    void load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, userId]);

  return (
    <Modal
      open={open}
      title={`Warnings · ${userEmail ?? ""}`}
      onClose={onClose}
      footer={
        <>
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={loading || mutating}
          >
            Close
          </Button>
        </>
      }
    >
      <FormError message={error} />

      <div className="rounded-md border-2 border-fern bg-surface-strong p-3">
        <div className="text-sm font-semibold">Create warning</div>

        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <Select
            value={severity}
            onChange={(e) => {
              const value = e.target.value;
              if (isSeverityValue(value)) setSeverity(value);
            }}
          >
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
          </Select>

          <Select
            value={expiresIn}
            onChange={(e) => {
              const value = e.target.value;
              if (isExpiresInValue(value)) setExpiresIn(value);
            }}
          >
            <option value="none">No expiry</option>
            <option value="7">Expires in 7d</option>
            <option value="30">Expires in 30d</option>
          </Select>

          <Button
            variant="secondary"
            onClick={() => void create()}
            disabled={mutating || message.trim().length < 3}
          >
            Create
          </Button>
        </div>

        <div className="mt-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Message (min 3 chars)…"
          />
        </div>
      </div>

      <div className="mt-4">
        <div className="text-sm font-semibold">Warnings list</div>

        <div className="mt-2 space-y-2">
          {items.length ? (
            items.map((w) => (
              <div
                key={w.id}
                className="rounded-md border-2 border-fern bg-surface-strong p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs opacity-70">
                      {w.severity} · {formatDate(w.createdAt)}
                      {w.expiresAt
                        ? ` · expires ${formatDate(w.expiresAt)}`
                        : ""}
                    </div>
                    <div className="mt-1 text-sm">{w.message}</div>
                    <div className="mt-1 text-xs opacity-70">
                      by {w.createdByAdmin.displayName}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm opacity-70">No warnings yet.</div>
          )}
        </div>

        {nextCursor ? (
          <div className="mt-3">
            <Button
              variant="secondary"
              onClick={() => void load(false)}
              disabled={loading}
            >
              Load more
            </Button>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
