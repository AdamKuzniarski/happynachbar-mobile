"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { FormError } from "@/components/ui/FormError";
import {
  ACTIVITY_CATEGORIES,
  ActivityCategory,
  formatActivityCategory,
} from "@/lib/api/enums";
import {
  adminGetActivity,
  adminUpdateActivity,
} from "@/lib/api/admin/activities";

export function EditActivityModal({
  open,
  activityId,
  onClose,
  onSaved,
}: {
  open: boolean;
  activityId: string | null;
  onClose: () => void;
  onSaved: (patch: {
    id: string;
    title?: string;
    description?: string;
    plz?: string;
    category?: ActivityCategory;
  }) => void;
}) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [plz, setPlz] = React.useState("");
  const [category, setCategory] = React.useState<ActivityCategory>(
    ACTIVITY_CATEGORIES[0],
  );

  React.useEffect(() => {
    if (!open || !activityId) {
      // reset state when modal closes or id changes away
      setTitle("");
      setDescription("");
      setPlz("");
      setCategory(ACTIVITY_CATEGORIES[0]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const a = await adminGetActivity(activityId);
        setTitle(a?.title ?? "");
        setDescription(a?.description ?? "");
        setPlz(a?.plz ?? "");
        setCategory(a?.category ?? ACTIVITY_CATEGORIES[0]);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, activityId]);

  async function save() {
    if (!activityId) return;

    setLoading(true);
    setError(null);

    try {
      await adminUpdateActivity(activityId, {
        title: title.trim(),
        description: description.trim(),
        plz,
        category,
      });

      onSaved({
        id: activityId,
        title: title.trim(),
        description: description.trim(),
        plz,
        category,
      });
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  const canSave = title.trim().length >= 3 && plz.length === 5;

  return (
    <Modal
      open={open}
      title="Edit activity"
      onClose={() => (!loading ? onClose() : null)}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={loading || !canSave}>
            Save
          </Button>
        </>
      }
    >
      <FormError message={error} />

      <div className="grid gap-3">
        <div>
          <label className="block text-sm font-medium">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div>
          <label className="block text-sm font-medium">Description</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Category</label>
            <Select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as ActivityCategory)
              }
            >
              {ACTIVITY_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {formatActivityCategory(c)}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium">PLZ</label>
            <Input
              value={plz}
              inputMode="numeric"
              onChange={(e) =>
                setPlz(e.target.value.replace(/\D+/g, "").slice(0, 5))
              }
            />
            <p className="mt-1 text-xs opacity-70">Must be 5 digits.</p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
