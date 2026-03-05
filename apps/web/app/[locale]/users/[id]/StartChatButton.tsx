"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { FormError } from "@/components/ui/FormError";
import { Mail } from "lucide-react";
import { startChatWithUser } from "./actions";

function SubmitButton({ variant }: { variant: "button" | "icon" }) {
  const { pending } = useFormStatus();
  const t = useTranslations("activities");
  const tCommon = useTranslations("common");
  if (variant === "icon") {
    return (
      <button
        type="submit"
        disabled={pending}
        aria-label={t("creator.contactAria")}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-fern/50 text-foreground/80 hover:bg-fern/10 hover:text-foreground"
      >
        <Mail className="h-4 w-4" aria-hidden="true" />
      </button>
    );
  }

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-md border-2 border-fern bg-surface px-4 py-1.5 text-sm font-semibold text-foreground"
    >
      {pending ? tCommon("loading") : t("creator.contact")}
    </button>
  );
}

export function StartChatButton({
  userId,
  variant = "button",
}: {
  userId: string;
  variant?: "button" | "icon";
}) {
  const locale = useLocale();
  const [state, action] = React.useActionState(startChatWithUser, null);

  return (
    <form action={action} className="flex flex-col items-center gap-2">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="userId" value={userId} />
      <SubmitButton variant={variant} />
      {variant === "icon" ? null : <FormError message={state?.error ?? null} />}
    </form>
  );
}
