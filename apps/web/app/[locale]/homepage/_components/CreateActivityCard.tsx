"use client";

import { Button } from "@/components/ui/Button";
import { useTranslations } from "next-intl";

export function CreateActivityCard({
  creating,
  onCreate,
}: {
  creating: boolean;
  onCreate: () => void;
}) {
  const t = useTranslations("homepage.create");
  const tCommon = useTranslations("common");
  return (
    <Button
      type="button"
      onClick={onCreate}
      disabled={creating}
      variant="secondary"
      className="min-h-[96px] w-full rounded-md border-0 bg-surface p-3 shadow-sm hover:shadow-md hover:bg-surface-strong transition-all no-underline"
      aria-label={t("aria")}
    >
      <div className="flex h-full flex-col items-center justify-center">
        <div className="text-4xl font-bold leading-none text-foreground">
          {creating ? tCommon("loading") : "+"}
        </div>
        <div className="mt-1 text-xs font-medium text-foreground">
          {t("label")}
        </div>
      </div>
    </Button>
  );
}
