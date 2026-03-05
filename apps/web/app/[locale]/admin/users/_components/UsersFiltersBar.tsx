"use client";

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { AdminUserRole } from "@/lib/api/admin/users";

export function UsersFiltersBar({
  q,
  onQ,
  onSearch,
  loading,
  role,
  onRole,
}: {
  q: string;
  onQ: (v: string) => void;
  role: AdminUserRole | "all";
  onRole: (v: AdminUserRole | "all") => void;
  banned: "all" | "banned" | "active";
  onBanned: (v: "all" | "banned" | "active") => void;
  onSearch: () => void;
  loading: boolean;
}) {
  const isRoleValue = (value: string): value is AdminUserRole | "all" =>
    value === "all" ||
    value === "USER" ||
    value === "MODERATOR" ||
    value === "ADMIN";

  return (
    <div className="grid gap-2 sm:grid-cols-4">
      <Input
        value={q}
        onChange={(e) => onQ(e.target.value)}
        placeholder="Search email / displayName"
      />

      <Select
        value={role}
        onChange={(e) => {
          const value = e.target.value;
          if (isRoleValue(value)) onRole(value);
        }}
      >
        <option value="all">All roles</option>

        <option value="USER">USER</option>
        <option value="MODERATOR">MODERATOR</option>
        <option value="ADMIN">ADMIN</option>
      </Select>

      <Button variant="secondary" onClick={onSearch} disabled={loading}>
        {" "}
        Search
      </Button>
    </div>
  );
}
