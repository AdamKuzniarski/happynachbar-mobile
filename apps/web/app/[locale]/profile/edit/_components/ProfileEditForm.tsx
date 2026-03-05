"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { updateProfileAction } from "../actions";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { normalizePostalCodeInput } from "@/lib/validators";
import { uploadAvatarImage } from "@/lib/api/uploads";
import { useLocale, useTranslations } from "next-intl";

type ProfileEditFormProps = {
  initial: {
    displayName?: string | null;
    plz?: string | null;
    avatarUrl?: string | null;
    bio?: string | null;
  };
};

type FormState = { error?: string };

function getInitials(name?: string | null) {
  if (!name) return "N";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "N";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "N";
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  return (
    <Button type="submit" disabled={pending}>
      {pending ? tCommon("saving") : t("actions.save")}
    </Button>
  );
}

export function ProfileEditForm({ initial }: ProfileEditFormProps) {
  const t = useTranslations("profile");
  const locale = useLocale();
  const [state, formAction] = React.useActionState<FormState, FormData>(
    updateProfileAction,
    {},
  );
  const [plz, setPlz] = React.useState(initial.plz ?? "");
  const displayName = initial.displayName ?? "";
  const [avatarUrl, setAvatarUrl] = React.useState(initial.avatarUrl ?? "");
  const [uploading, setUploading] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);

  return (
    <form action={formAction} className="mt-4 space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <div className="flex flex-col items-center">
        <Label>{t("form.avatarLabel")}</Label>
        <div className="mt-2 flex flex-col items-center gap-2">
          <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-fern bg-surface-strong text-lg font-semibold text-foreground">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={t("avatarAlt", {
                  name: displayName || t("fallback.neighbor"),
                })}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                {getInitials(displayName)}
              </div>
            )}
          </div>
        </div>
        <div className="mt-6 grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
          <Input
            id="avatarUrl"
            name="avatarUrl"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder={t("form.avatarUrlPlaceholder")}
            className="h-9 text-xs"
          />
          <Input
            id="avatarUpload"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file || uploading) return;
              setLocalError(null);
              setUploading(true);
              try {
                const url = await uploadAvatarImage(file);
                setAvatarUrl(url);
              } catch (err: unknown) {
                setLocalError(
                  err instanceof Error ? err.message : t("errors.uploadFailed"),
                );
              } finally {
                setUploading(false);
                e.currentTarget.value = "";
              }
            }}
            disabled={uploading}
            className="h-9 text-xs"
          />
        </div>
        {uploading ? (
          <p className="mt-1 text-xs text-hunter text-center">
            {t("form.uploading")}
          </p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="displayName">{t("form.displayNameLabel")}</Label>
        <Input
          id="displayName"
          name="displayName"
          defaultValue={displayName}
          placeholder={t("form.displayNamePlaceholder")}
        />
      </div>

      <div>
        <Label htmlFor="plz">{t("form.postalCodeLabel")}</Label>
        <Input
          id="plz"
          name="plz"
          value={plz}
          onChange={(e) => setPlz(normalizePostalCodeInput(e.target.value))}
          placeholder={t("form.postalCodePlaceholder")}
          inputMode="numeric"
          maxLength={5}
        />
      </div>

      <div>
        <Label htmlFor="bio">{t("form.bioLabel")}</Label>
        <Textarea
          id="bio"
          name="bio"
          defaultValue={initial.bio ?? ""}
          placeholder={t("form.bioPlaceholder")}
        />
      </div>

      <FormError message={localError ?? state?.error ?? null} />

      <div className="flex justify-center gap-2">
        <SubmitButton />
        <Button
          type="button"
          variant="secondary"
          onClick={() => history.back()}
        >
          {t("actions.cancel")}
        </Button>
      </div>
    </form>
  );
}
