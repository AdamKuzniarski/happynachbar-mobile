"use client";

import { useParams, useRouter } from "next/navigation";
import * as React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { deleteActivity } from "@/lib/api/activities";
import { defaultLocale, isLocale } from "@/lib/i18n";
import { useTranslations } from "next-intl";

export function ActivityActions({
  id,
  createdById,
  currentUserId,
}: {
  id: string;
  createdById?: string;
  currentUserId?: string;
}) {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations("activities");
  const tCommon = useTranslations("common");
  const localeParam = params?.locale;
  const locale =
    typeof localeParam === "string" && isLocale(localeParam)
      ? localeParam
      : defaultLocale;
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const canManage =
    !createdById || !currentUserId ? true : createdById === currentUserId;

  function onEdit() {
    if (deleting) return;
    if (createdById && currentUserId && createdById !== currentUserId) {
      setError(
        t("errors.notOwner"),
      );
      return;
    }
    setError(null);
    router.push(`/${locale}/activities/${encodeURIComponent(id)}/edit`);
  }

  async function onDelete() {
    if (deleting) return;
    if (createdById && currentUserId && createdById !== currentUserId) {
      setError(
        t("errors.notOwner"),
      );
      return;
    }
    setError(null);
    const ok = window.confirm(t("confirmDelete"));
    if (!ok) return;
    setDeleting(true);
    try {
      const res = await deleteActivity(id);
      if (!res.ok) {
        const msg = Array.isArray(res.message)
          ? res.message.join(", ")
          : res.message ?? t("errors.deleteFailed");
        setError(msg);
        return;
      }
      router.push(`/${locale}/homepage`);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {canManage ? (
        <div className="flex justify-center gap-2">
          <Button
            type="button"
            variant="secondary"
            className="hover:bg-fern/20 hover:text-foreground"
            onClick={onEdit}
            disabled={deleting}
            aria-label={t("actions.edit")}
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">{t("actions.edit")}</span>
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="hover:bg-fern/20 hover:text-foreground"
            onClick={onDelete}
            disabled={deleting}
            aria-label={t("actions.delete")}
          >
            {deleting ? (
              tCommon("deleting")
            ) : (
              <>
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                <span className="sr-only">{t("actions.delete")}</span>
              </>
            )}
          </Button>
        </div>
      ) : null}
      <FormError message={error} />
    </div>
  );
}
