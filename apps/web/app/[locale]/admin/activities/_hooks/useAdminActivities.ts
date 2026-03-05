"use client";

import * as React from "react";
import type { AdminActivityRow } from "@/lib/api/admin/types";
import {
  adminListActivities,
  adminSetActivityStatus,
} from "@/lib/api/admin/activities";

function errMsg(e: unknown) {
  return e instanceof Error ? e.message : "Unknown error";
}

export function useAdminActivities() {
  const [q, setQ] = React.useState("");
  const [items, setItems] = React.useState<AdminActivityRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [editId, setEditId] = React.useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);

    try {
      const res = await adminListActivities({ take: 20, q });
      setItems(res?.items ?? []);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openEdit(id: string) {
    setEditId(id);
  }
  function closeEdit() {
    setEditId(null);
  }

  function patchRow(patch: { id: string } & Partial<AdminActivityRow>) {
    setItems((prev) =>
      prev.map((a) => (a.id === patch.id ? { ...a, ...patch } : a)),
    );
  }

  async function archiveOn(id: string) {
    try {
      await adminSetActivityStatus(id, "ARCHIVED");
      patchRow({ id, status: "ARCHIVED" });
    } catch (e) {
      setError(errMsg(e));
    }
  }

  async function restoreOne(id: string) {
    try {
      await adminSetActivityStatus(id, "ACTIVE");
      patchRow({ id, status: "ACTIVE" });
    } catch (e) {
      setError(errMsg(e));
    }
  }
  return {
    q,
    setQ,
    items,
    loading,
    error,
    load,
    editId,
    openEdit,
    closeEdit,
    patchRow,
    archiveOn,
    restoreOne,
  };
}
