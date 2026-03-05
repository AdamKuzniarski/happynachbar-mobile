"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { FormError } from "@/components/ui/FormError";
import {
  buildBanReason,
  buildBanReasonWithUntil,
  parseBanUntil,
  stripBanMeta,
} from "../_lib/banReason";
import { formatDate } from "@/lib/format";
import type { AdminUserRow } from "@/lib/api/admin/users";

type Duration = "1" | "3" | "7" | "30" | "PERM" | "KEEP";

export function BanUserModal({
  open,
  user,
  busy,
  error,
  onClose,
  onConfirmBan,
}: {
  open: boolean;
  user: AdminUserRow | null;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onConfirmBan: (reason?: string) => void;
}) {
  const [duration, setDuration] = React.useState<Duration>("7");
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    if (!user) return;
    setReason(stripBanMeta(user.banReason));
    setDuration(user.isBanned ? "KEEP" : "7");
  }, [user]);

  if (!user) return null;

  const until = parseBanUntil(user.banReason);

  return (
    <Modal
      open={open}
      title={user.isBanned ? "Update ban info" : "Ban user"}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              if (duration === "KEEP") {
                const banReason = buildBanReasonWithUntil(reason, until);
                onConfirmBan(banReason);
                return;
              }

              const days = duration === "PERM" ? "PERM" : Number(duration);
              const banReason = buildBanReason(reason, days);
              onConfirmBan(banReason);
            }}
            disabled={busy}
          >
            {user.isBanned ? "Update ban reason" : "Ban"}
          </Button>
        </>
      }
    >
      <FormError message={error} />

      <div className="text-sm opacity-80">Duration</div>
      <Select
        value={duration}
        onChange={(e) => setDuration(e.target.value as Duration)}
      >
        {user.isBanned ? (
          <option value="KEEP">Keep existing duration</option>
        ) : null}
        <option value="1">1 Day</option>
        <option value="3">3 Days</option>
        <option value="7">7 Days</option>
        <option value="30">30 Days</option>
        <option value="PERM">Permanent</option>
      </Select>

      <small className="text-xs opacity-70">
        Note: Backend does not auto-unban. This only stores &quot until... &quot
        in the ban reason.
      </small>
      {user.isBanned ? (
        <div className="text-xs opacity-80">
          Banned at: {formatDate(user.bannedAt ?? undefined)}
          {until ? (
            <>
              Until: {formatDate(until.toISOString())}
            </>
          ) : null}
        </div>
      ) : null}

      <div className="text-xs opacity-80 font-semibold">Reason</div>
      <Textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Optional reason (stored in DB)"
      />
    </Modal>
  );
}
