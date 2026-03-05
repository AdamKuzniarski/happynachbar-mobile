"use client";

import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { UsersFiltersBar } from "./UsersFiltersBar";
import { UsersTable } from "./UsersTable";
import { BanUserModal } from "./BanUserModal";
import { UserWarningsModal } from "./UserWarningsModal";
import { useAdminUsers } from "../_hooks/useAdminUsers";

export function AdminUsersScreen() {
  const s = useAdminUsers();

  const [banUserId, setBanUserId] = React.useState<string | null>(null);
  const [warningsUserId, setWarningsUserId] = React.useState<string | null>(
    null,
  );

  const banUser = s.items.find((u) => u.id === banUserId) ?? null;
  const warningsUser = s.items.find((u) => u.id === warningsUserId) ?? null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold">Admin · Users</h1>
          <p className="mt-1 text-sm opacity-80">
            Search, roles, ban/unban, warnings. (Timed ban is FE-only via
            banReason.)
          </p>
        </div>

        <Button
          variant="secondary"
          onClick={() => void s.load(true)}
          disabled={s.loading}
        >
          Refresh
        </Button>
      </div>

      <FormError message={s.error} />

      <Card>
        <UsersFiltersBar
          q={s.q}
          onQ={s.setQ}
          role={s.role}
          onRole={s.setRole}
          banned={s.banned}
          onBanned={s.setBanned}
          onSearch={() => void s.load(true)}
          loading={s.loading}
        />
      </Card>

      <UsersTable
        items={s.items}
        mutatingId={s.mutatingId}
        onRole={(id, r) => void s.changeRole(id, r)}
        onBanClick={(id) => setBanUserId(id)}
        onUnban={(id) => void s.setBan(id, false)}
        onWarnings={(id) => setWarningsUserId(id)}
      />

      <div className="flex items-center justify-between">
        <div className="text-xs opacity-70">
          {s.items.length ? `${s.items.length} loaded` : "No users loaded yet."}
        </div>

        {s.nextCursor ? (
          <Button
            variant="secondary"
            onClick={() => void s.load(false)}
            disabled={s.loading}
          >
            Load more
          </Button>
        ) : null}
      </div>

      <BanUserModal
        open={!!banUserId}
        user={banUser}
        busy={!!s.mutatingId}
        error={s.error}
        onClose={() => setBanUserId(null)}
        onConfirmBan={(reason) => {
          if (!banUserId) return;
          void s.setBan(banUserId, true, reason);
          setBanUserId(null);
        }}
      />

      <UserWarningsModal
        open={!!warningsUserId}
        userId={warningsUser?.id ?? null}
        userEmail={warningsUser?.email ?? null}
        onClose={() => setWarningsUserId(null)}
      />
    </div>
  );
}
