"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/format";
import type { AdminUserRole, AdminUserRow } from "@/lib/api/admin/users";
import { parseBanUntil } from "../_lib/banReason";

export function UsersTable({
  items,
  mutatingId,
  onRole,
  onBanClick,
  onUnban,
  onWarnings,
}: {
  items: AdminUserRow[];
  mutatingId: string | null;

  onRole: (userId: string, role: AdminUserRole) => void;
  onBanClick: (userId: string) => void;
  onUnban: (userId: string) => void;
  onWarnings: (userId: string) => void;
}) {
  return (
    <Card className="p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b-2 border-fern bg-surface-strong">
            <tr>
              <th className="px-3 py-3">User</th>
              <th className="px-3 py-3">Role</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Last active</th>
              <th className="px-3 py-3">Created</th>
              <th className="px-3 py-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {items.map((u) => {
              const busy = mutatingId === u.id;
              const until = parseBanUntil(u.banReason);

              return (
                <tr key={u.id} className="border-b border-fern/40">
                  <td className="px-3 py-3">
                    <div className="font-medium">{u.email}</div>
                    <div className="text-xs opacity-70">
                      {u.profile?.displayName ?? "Neighbor"} ·{" "}
                      {u.profile?.plz ?? "-"}
                    </div>
                    <div className="text-xs opacity-60">{u.id}</div>
                  </td>

                  <td className="px-3 py-3">
                    <select
                      value={u.role}
                      onChange={(e) =>
                        onRole(u.id, e.target.value as AdminUserRole)
                      }
                      disabled={busy}
                    >
                      <option value="USER">USER</option>
                      <option value="MODERATOR">MODERATOR</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>

                  <td className="px-3 py-3">
                    {u.isBanned ? (
                      <div className="space-y-1">
                        <Badge variant="danger">BANNED</Badge>
                        {until ? (
                          <div className="text-xs opacity-70">
                            until {formatDate(until.toISOString())}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <Badge variant="success">ACTIVE</Badge>
                    )}
                  </td>

                  <td className="px-3 py-3">
                    {formatDate(u.lastActiveAt ?? undefined)}
                  </td>
                  <td className="px-3 py-3">{formatDate(u.createdAt)}</td>

                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => onWarnings(u.id)}
                        disabled={busy}
                      >
                        Warnings
                      </Button>

                      {u.isBanned ? (
                        <Button
                          variant="secondary"
                          onClick={() => onUnban(u.id)}
                          disabled={busy}
                        >
                          Unban
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          onClick={() => onBanClick(u.id)}
                          disabled={busy}
                        >
                          Ban
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
