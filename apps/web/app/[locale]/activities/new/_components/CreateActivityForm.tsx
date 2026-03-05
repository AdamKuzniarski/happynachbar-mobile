"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  createActivity,
  updateActivity,
  uploadActivityImages,
} from "@/lib/api/activities";
import { ActivityFormFields } from "../../_components/ActivityFormFields";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { FormError } from "@/components/ui/FormError";
import { isValidPostalCode, getManualUrlAddResult } from "@/lib/validators";
import type { ActivityDetail, ManualUrlAddStatus } from "@/lib/api/types";
import { toDateTimeLocal } from "@/lib/format";
import { defaultLocale, isLocale } from "@/lib/i18n";
import { useTranslations } from "next-intl";

type CreateActivityFormProps =
  | { mode?: "create"; activity?: undefined }
  | { mode: "edit"; activity: ActivityDetail };

export function CreateActivityForm(props: CreateActivityFormProps) {
  const mode = props.mode ?? "create";
  const activity = props.mode === "edit" ? props.activity : undefined;
  const router = useRouter();
  const params = useParams();
  const t = useTranslations("activities");
  const tCommon = useTranslations("common");
  const localeParam = params?.locale;
  const locale =
    typeof localeParam === "string" && isLocale(localeParam)
      ? localeParam
      : defaultLocale;

  const [title, setTitle] = React.useState(activity?.title ?? "");
  const [category, setCategory] = React.useState(activity?.category ?? "");
  const [plz, setPlz] = React.useState(activity?.plz ?? "");
  const [description, setDescription] = React.useState(
    activity?.description ?? "",
  );
  const [startAt, setStartAt] = React.useState(
    toDateTimeLocal(activity?.startAt ?? activity?.scheduledAt),
  );
  const [files, setFiles] = React.useState<File[]>([]);
  const [imageUrls, setImageUrls] = React.useState<string[]>(
    Array.isArray(activity?.images) ? activity.images.map((i) => i.url) : [],
  );
  const [urlInput, setUrlInput] = React.useState("");
  const [urlStatus, setUrlStatus] = React.useState<"added" | "duplicate" | null>(
    null,
  );
  const [dragIndex, setDragIndex] = React.useState<number | null>(null);

  function applyManualUrlResult(status: ManualUrlAddStatus, value?: string) {
    if (status === "invalid" || status === "limit") {
      setError(t(`images.status.${status}`));
      return false;
    }
    if (status === "duplicate") {
      setUrlStatus("duplicate");
      return false;
    }
    if (status === "added" && value) {
      setImageUrls((prev) => [...prev, value]);
      setUrlInput("");
      setUrlStatus("added");
    }
    return true;
  }

  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!urlStatus) return;
    const t = setTimeout(() => setUrlStatus(null), 2000);
    return () => clearTimeout(t);
  }, [urlStatus]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;

    setError(null);

    //checks
    if (title.trim().length < 3)
      return setError(t("errors.titleMin"));
    if (!category) return setError(t("errors.categoryRequired"));
    if (!isValidPostalCode(plz)) return setError(t("errors.postalCodeInvalid"));

    let nextImageUrls = imageUrls;
    const normalizedUrlInput = urlInput.trim();
    {
      const { status, value } = getManualUrlAddResult(
        urlInput,
        imageUrls,
        5,
        files.length,
      );
      if (status === "invalid" || status === "limit") {
        setError(t(`images.status.${status}`));
        return;
      }
      if (status === "duplicate") {
        if (normalizedUrlInput && imageUrls.includes(normalizedUrlInput)) {
          setUrlInput("");
          setUrlStatus(null);
        } else {
          setUrlStatus("duplicate");
          return;
        }
      }
      if (status === "added" && value) {
        nextImageUrls = [...imageUrls, value];
        setImageUrls(nextImageUrls);
        setUrlInput("");
        setUrlStatus("added");
      }
    }

    if (files.length + nextImageUrls.length > 5) {
      return setError(t("errors.maxImages"));
    }

    setSaving(true);
    try {
      const uploadedUrls = await uploadActivityImages(files);
      const allUrls = [...nextImageUrls, ...uploadedUrls].filter(Boolean);
      const startAtIso = startAt ? new Date(startAt).toISOString() : undefined;
      const result =
        mode === "edit" && activity
          ? await updateActivity(activity.id, {
              title: title.trim(),
              category,
              plz: plz.trim(),
              description: description.trim() || undefined,
              startAt: startAtIso,
              imageUrls: allUrls,
            })
          : await createActivity({
              title: title.trim(),
              category,
              plz: plz.trim(),
              description: description.trim() || undefined,
              startAt: startAtIso,
              imageUrls: allUrls.length ? allUrls : undefined,
            });
      if (!result.ok) {
        const msg = Array.isArray(result.message)
          ? result.message.join(", ")
          : result.message ?? t("errors.createFailed");
        setError(msg);
        return;
      }
      if (mode === "edit" && activity) {
        router.push(`/${locale}/activities/${encodeURIComponent(activity.id)}`);
      } else {
        router.push(`/${locale}/homepage`);
      }
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t("errors.uploadFailed");
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-md border-2 border-fern bg-surface p-4 shadow-sm sm:p-6">
      <h1 className="text-lg font-semibold text-center">
        {mode === "edit" ? t("headingEdit") : t("headingCreate")}
      </h1>

      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <ActivityFormFields
          title={title}
          setTitle={setTitle}
          category={category}
          setCategory={setCategory}
          plz={plz}
          setPlz={setPlz}
          description={description}
          setDescription={setDescription}
          startAt={startAt}
          setStartAt={setStartAt}
        />

        <div>
          <Label htmlFor="images">{t("images.label")}</Label>
          <Input
            id="images"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            onChange={(e) => {
              const list = Array.from(e.target.files ?? []);
              const maxFiles = Math.max(0, 5 - imageUrls.length);
              if (list.length > maxFiles) {
                setError(t("errors.maxImages"));
                setFiles(list.slice(0, maxFiles));
                return;
              }
              setFiles(list);
            }}
          />
          {files.length ? (
            <p className="mt-1 text-xs text-hunter">
              {t("images.selectedCount", { count: files.length })}
            </p>
          ) : null}
          {mode === "edit" && imageUrls.length ? (
            <div className="mt-2 grid grid-cols-3 gap-2">
              {imageUrls.map((url, idx) => (
                <div
                  key={`${url}-${idx}`}
                  className="relative rounded-md border-2 border-fern bg-surface"
                  draggable={mode === "edit"}
                  onDragStart={() => mode === "edit" && setDragIndex(idx)}
                  onDragOver={(e) => mode === "edit" && e.preventDefault()}
                  onDrop={() => {
                    if (mode !== "edit") return;
                    if (dragIndex == null || dragIndex === idx) return;
                    setImageUrls((prev) => {
                      const next = [...prev];
                      const [moved] = next.splice(dragIndex, 1);
                      next.splice(idx, 0, moved);
                      return next;
                    });
                    setDragIndex(null);
                  }}
                >
                  <img
                    src={url}
                    alt={t("images.alt")}
                    className="h-20 w-full rounded-md object-cover"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="absolute right-1 top-1 px-2 py-1 text-[10px] leading-none"
                    onClick={() =>
                      setImageUrls((prev) => prev.filter((_, i) => i !== idx))
                    }
                  >
                    {t("images.remove")}
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div>
          <Label htmlFor="imageUrl">{t("images.urlLabel")}</Label>
          <div className="mt-1 flex gap-2">
            <Input
              id="imageUrl"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder={t("images.urlPlaceholder")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const { status, value } = getManualUrlAddResult(
                    urlInput,
                    imageUrls,
                    5,
                    files.length,
                  );
                  applyManualUrlResult(status, value);
                }
              }}
              onBlur={() => {
                const { status, value } = getManualUrlAddResult(
                  urlInput,
                  imageUrls,
                  5,
                  files.length,
                );
                applyManualUrlResult(status, value);
              }}
            />
            <Button
              type="button"
              variant="ghost"
              className="text-xs px-2 py-1"
              onClick={() => {
                const { status, value } = getManualUrlAddResult(
                  urlInput,
                  imageUrls,
                  5,
                  files.length,
                );
                applyManualUrlResult(status, value);
              }}
            >
              {t("images.addUrlButton")}
            </Button>
          </div>
          {urlStatus === "added" ? (
            <p className="text-xs text-hunter">
              {t("images.status.added")}
            </p>
          ) : null}
          {urlStatus === "duplicate" ? (
            <p className="text-xs text-red-600">
              {t("images.status.duplicate")}
            </p>
          ) : null}
          {mode === "create" && imageUrls.length ? (
            <div className="mt-2 space-y-1 text-xs text-hunter">
              {imageUrls.map((url, idx) => (
                <div key={`${url}-${idx}`} className="flex items-center gap-2">
                  <span className="truncate">{url}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-xs underline px-0 py-0"
                    onClick={() =>
                      setImageUrls((prev) => prev.filter((_, i) => i !== idx))
                    }
                  >
                    {t("images.remove")}
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
          {mode === "edit" && imageUrls.length ? (
            <p className="mt-2 text-xs text-hunter">
              {t("images.reorderHint")}
            </p>
          ) : null}
        </div>

        <FormError message={error} />

        <div className="flex justify-center gap-2">
          <Button type="submit" disabled={saving}>
            {saving
              ? tCommon("saving")
              : mode === "edit"
                ? t("actions.save")
                : t("actions.create")}
          </Button>
          {mode === "edit" && activity ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                router.push(`/${locale}/activities/${encodeURIComponent(activity.id)}`)
              }
            >
              {t("actions.cancel")}
            </Button>
          ) : null}
        </div>
      </form>
    </section>
  );
}
