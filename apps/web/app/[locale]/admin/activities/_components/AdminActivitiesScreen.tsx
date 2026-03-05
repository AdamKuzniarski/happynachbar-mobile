"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAdminActivities } from "../_hooks/useAdminActivities";
import { ActivitiesTable } from "./ActivitiesTable";
import { EditActivityModal } from "./EditActivityModal";

export function AdminActivitiesScreen() {
  const s = useAdminActivities();

  return (
    <div className="space-y-4">
      <Card>
        <h1 className="text-lg font-semibold">Admin · Activities</h1>
        <p className="mt-1 text-sm opacity-80">
          Suche Aktivitäten um die zu verwalten{" "}
        </p>

        <form
          className="mt-4 flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            void s.load();
          }}
        >
          <Input
            placeholder="Search title/description…"
            value={s.q}
            onChange={(e) => s.setQ(e.target.value)}
          />
          <Button type="submit" disabled={s.loading}>
            Search
          </Button>
        </form>

        {s.error ? (
          <p className="mt-3 text-sm text-evergreen">{s.error}</p>
        ) : null}
      </Card>

      {s.loading && s.items.length === 0 ? (
        <Card>
          <p className="text-sm">Loading…</p>
        </Card>
      ) : null}

      {s.items.length > 0 ? (
        <ActivitiesTable
          items={s.items}
          onEdit={s.openEdit}
          onArchive={(id) => void s.archiveOn(id)}
          onRestore={(id) => void s.restoreOne(id)}
        />
      ) : null}

      <EditActivityModal
        open={!!s.editId}
        activityId={s.editId}
        onClose={s.closeEdit}
        onSaved={s.patchRow}
      />
    </div>
  );
}
