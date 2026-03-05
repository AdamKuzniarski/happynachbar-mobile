"use client";

import * as React from "react";
import type { AdminUserRole, AdminUserRow } from "@/lib/api/admin/users";
import {
  adminListUsers,
  adminSetUserBan,
  adminSetUserRole,
} from "@/lib/api/admin/users";

type BannedFilter = "all" | "banned" | "active";

export function useAdminUsers() {
  const [q, setQ] = React.useState("");
  const [role, setRole] = React.useState<AdminUserRole | "all">("all");
  const [banned, setBanned] = React.useState<BannedFilter>("all");

  const [items, setItems] = React.useState<AdminUserRow[]>([]);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [mutatingId, setMutatingId] = React.useState<string | null>(null);

  async function load(reset: boolean) {
    setLoading(true);
    setError(null);

    try {
      const res = await adminListUsers({
        take: 20,
        cursor: reset ? null : nextCursor,
        q: q.trim() || undefined,
        role: role === "all" ? undefined : role,
        isBanned:
          banned === "all" ? undefined : banned === "banned" ? true : false,
      });

      const newItems = res?.items ?? [];
      const cursor = res?.nextCursor ?? null;

      setItems((prev) => (reset ? newItems : [...prev, ...newItems]));
      setNextCursor(cursor);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function patchUser(userId: string, patch: Partial<AdminUserRow>) {
    setItems((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...patch } : u)),
    );
  }

  async function changeRole(userId: string, newRole: AdminUserRole) {
    setMutatingId(userId);
    setError(null);

    const before = items.find((u) => u.id === userId)?.role;

    try {
      patchUser(userId, { role: newRole });
      await adminSetUserRole(userId, newRole);
    } catch (error) {
      if (before) patchUser(userId, { role: before });
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setMutatingId(null);
    }
  }

  async function setBan(userId: string, isBanned: boolean, reason?: string) {
    setMutatingId(userId);
    setError(null);

    try {
      const res = await adminSetUserBan(userId, { isBanned, reason });
      patchUser(userId, {
        isBanned: res?.isBanned ?? isBanned,
        bannedAt: res?.bannedAt ?? (isBanned ? new Date().toISOString() : null),
        banReason: res?.banReason ?? (isBanned ? (reason ?? null) : null),
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setMutatingId(null);
    }
  }

  return {
    q,
    setQ,
    role,
    setRole,
    banned,
    setBanned,

    items,
    nextCursor,
    loading,
    error,

    load,
    changeRole,
    setBan,

    mutatingId,
  };
}
