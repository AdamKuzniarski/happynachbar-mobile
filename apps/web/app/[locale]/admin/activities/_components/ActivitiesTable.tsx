"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/format";
import { formatActivityCategory } from "@/lib/api/enums";
import type { AdminActivityRow } from "@/lib/api/admin/types";

export function ActivitiesTable({
  items,
  onEdit,
  onArchive,
  onRestore,
}: {
  items: AdminActivityRow[];
  onEdit: (id: string) => void;
  onArchive: (id: string) => void;
  onRestore: (id: string) => void;
}) {
  return (
    <Card className="p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b-2 border-fern bg-surface-strong">
            <tr>
              <th className="px-3 py-3">Title</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Category</th>
              <th className="px-3 py-3">PLZ</th>
              <th className="px-3 py-3">Created</th>
              <th className="px-3 py-3">By</th>
              <th className="px-3 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id} className="border-b border-fern/40">
                <td className="px-3 py-3">
                  <div className="font-medium">{a.title}</div>
                  <div className="text-xs opacity-70">{a.id}</div>
                </td>
                <td className="px-3 py-3">{a.status}</td>
                <td className="px-3 py-3">
                  {formatActivityCategory(a.category)}
                </td>
                <td className="px-3 py-3 font-mono">{a.plz}</td>
                <td className="px-3 py-3">{formatDate(a.createdAt)}</td>
                <td className="px-3 py-3">
                  <div className="font-medium">{a.createdBy.displayName}</div>
                  <div className="text-xs opacity-70">{a.createdBy.email}</div>
                </td>
                <td className="px-3 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => onEdit(a.id)}>
                      Edit
                    </Button>

                    {a.status === "ACTIVE" ? (
                      <Button
                        variant="secondary"
                        onClick={() => {
                          const ok = confirm(
                            "Archive this activity? (soft delete)",
                          );
                          if (ok) onArchive(a.id);
                        }}
                      >
                        Delete
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        onClick={() => onRestore(a.id)}
                      >
                        Restore
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
