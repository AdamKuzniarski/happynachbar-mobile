"use client";

import * as React from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { formatDate } from "@/lib/format";
import { getDbHealth } from "@/lib/api/health";
import { apiFetch } from "@/lib/api/client";
import {
  adminListActivities,
  adminSetActivityStatus,
} from "@/lib/api/admin/activities";
import { adminListUsers } from "@/lib/api/admin/users";
import type {
  AdminActivityRow,
  AdminActivityStatus,
} from "@/lib/api/admin/types";
import type { AdminUserRow } from "@/lib/api/admin/users";
import { StatCard } from "./StatCard";

type AdminPingRes = { ok: boolean; role: string };
type CountRes = { count: number; truncated: boolean };

async function countActivities(status: AdminActivityStatus): Promise<CountRes> {
  let cursor: string | null = null;
  let count = 0;

  const MAX_PAGES = 40; //40*50 =2000 rows
  for (let i = 0; i < MAX_PAGES; i++) {
    const res = await adminListActivities({ take: 50, status, cursor });
    const items = res?.items ?? [];
    count += items.length;

    cursor = res?.nextCursor ?? null;
    if (!cursor) return { count, truncated: false };
  }

  return { count, truncated: true };
}

export function AdminOverviewScreen() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [db, setDb] = React.useState<{
    status: string;
    usersCount: number;
  } | null>(null);
  const [adminOk, setAdminOk] = React.useState<boolean>(false);

  const [recentActive, setRecentActive] = React.useState<AdminActivityRow[]>(
    [],
  );
  const [recentArchived, setRecentArchived] = React.useState<
    AdminActivityRow[]
  >([]);
  const [bannedUsers, setBannedUsers] = React.useState<AdminUserRow[]>([]);

  const [counts, setCounts] = React.useState<{
    active: CountRes | null;
    archived: CountRes | null;
  }>({ active: null, archived: null });

  async function loadLight() {
    setLoading(true);
    setError(null);

    try {
      const [d, ping, act, arch, banned] = await Promise.all([
        getDbHealth(),
        apiFetch<AdminPingRes>("/admin/ping"),
        adminListActivities({ take: 10, status: "ACTIVE" }),
        adminListActivities({ take: 10, status: "ARCHIVED" }),
        adminListUsers({ take: 10, isBanned: true }),
      ]);

      setDb(d ? { status: d.status, usersCount: d.usersCount } : null);
      setAdminOk(!!ping?.ok);

      setRecentActive(act?.items ?? []);
      setRecentArchived(arch?.items ?? []);
      setBannedUsers(banned?.items ?? []);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function loadCounts() {
    try {
      const [active, archived] = await Promise.all([
        countActivities("ACTIVE"),
        countActivities("ARCHIVED"),
      ]);
      setCounts({ active, archived });
    } catch (err) {
      // Log the error but keep UI silent; counts are non-critical
      console.error("Failed to load activity counts:", err);
    }
  }

  React.useEffect(() => {
    void (async () => {
      await loadLight();
      await loadCounts();
    })();
  }, []);

  const totalPosts =
    (counts.active?.count ?? 0) + (counts.archived?.count ?? 0);

  async function setStatusQuick(id: string, status: AdminActivityStatus) {
    try {
      await adminSetActivityStatus(id, status);

      await loadLight(); // refresh

      //if count exist, adjust without recounting all pages
      setCounts((prev) => {
        if (!prev.active || !prev.archived) return prev;
        if (status === "ARCHIVED") {
          return {
            active: {
              ...prev.active,
              count: Math.max(0, prev.active.count - 1),
            },
            archived: { ...prev.archived, count: prev.archived.count + 1 },
          };
        }

        return {
          active: { ...prev.active, count: prev.active.count + 1 },
          archived: {
            ...prev.archived,
            count: Math.max(0, prev.archived.count - 1),
          },
        };
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error");
    }
  }

  const countsHint = (() => {
    const aT = counts.active?.truncated;
    const rT = counts.archived?.truncated;
    if (aT || rT) return "Counts capped at 2000 rows.";
    if (counts.active && counts.archived)
      return "Counts computed via paging (FE-only).";
    return "Counts not ready yet.";
  })();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">Admin Übersicht</h1>
          <p className="mt-1 text-sm opacity-80">
            Health, Gesamtübersicht, noch zur Moderation
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={() => void loadLight()}
          disabled={loading}
        >
          Akutalisieren
        </Button>
      </div>

      <FormError message={error} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="DB" value={db?.status ?? "-"} hint="GET /health/db" />
        <StatCard
          title="Users total"
          value={db ? String(db.usersCount) : "-"}
          hint="from /health/db"
        />
        <StatCard
          title="Posts total"
          value={counts.active && counts.archived ? String(totalPosts) : "…"}
          hint={countsHint}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <h2 className="text-base font-semibold">
            Warteschlange zur Moderation
            {/* // Moderations queue */}
          </h2>
          <p className="mt-1 text-sm opacity-80">
            Neueste archivierte und aktive Einträge + Schnellaktionen.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-sm font-semibold">Zuletzt achiviert</div>
              <div className="mt-2 space-y-2">
                {recentArchived.length ? (
                  recentArchived.map((a) => (
                    <div
                      key={a.id}
                      className="rounded-md border-2 border-fern bg-surface-strong p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate font-medium">{a.title}</div>
                          <div className="truncate text-xs opacity-70">
                            {formatDate(a.createdAt)} · {a.plz} ·{" "}
                            {a.createdBy.email}
                          </div>
                        </div>
                        <Button
                          className="shrink-0"
                          variant="secondary"
                          onClick={() => void setStatusQuick(a.id, "ACTIVE")}
                        >
                          Restore
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm opacity-70">
                    Zuletzt nichts archiviert...
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="text-sm font-semibold"> Zuletzt activ</div>
              <div className="mt-2 space-y-2">
                {recentActive.length ? (
                  recentActive.map((a) => (
                    <div
                      key={a.id}
                      className="rounded-md border-2 border-fern bg-surface-strong p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate font-medium">{a.title}</div>
                          <div className="text-xs opacity-70">
                            {formatDate(a.createdAt)} · {a.plz} ·{" "}
                            {a.createdBy.email}
                          </div>
                        </div>
                        <Button
                          variant="secondary"
                          onClick={() => {
                            const ok = confirm(
                              "Archivieren diese Aktivität?(soft delete)",
                            );
                            if (ok) void setStatusQuick(a.id, "ARCHIVED");
                          }}
                        >
                          Archiviern
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm opacity-70">
                    Keine Aktivitäten gefunden.
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-semibold">Gesperrte User</h2>
          <p className="mt-1 text-sm opacity-80">Zuletzt gesperrte Accounts.</p>

          <div className="mt-4 space-y-2">
            {bannedUsers.length ? (
              bannedUsers.map((u) => (
                <div
                  key={u.id}
                  className="rounded-md border-2 border-fern bg-surface-strong p-3"
                >
                  <div className="font-medium break-all">{u.email}</div>
                  <div className="text-xs opacity-70">
                    {u.profile?.displayName ?? "Neighbor"} ·{" "}
                    {u.profile?.plz ?? "-"}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm opacity-70">Keine gesperrten User</div>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-base font-semibold">Schnellaktionen</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <Link href="/admin/activities">Gehe zu Aktivitäten</Link>
          </Button>

          <Button asChild variant="secondary">
            <Link href="/admin/users">Gehe zu User</Link>
          </Button>

          <Button asChild variant="ghost">
            <Link href="/homepage">Gehe zu Homepage</Link>
          </Button>
          <div className="ml-auto text-xs opacity-70">
            Admin session: {adminOk ? "verified!" : "—"}
          </div>
        </div>
      </Card>
    </div>
  );
}
