"use client";

import { ACTIVITY_CATEGORIES, type ActivityCategory } from "@/lib/api/enums";
import type { ActivityFormFieldsProps } from "@/lib/api/types";
import { normalizePostalCodeInput } from "@/lib/validators";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useTranslations } from "next-intl";

export function ActivityFormFields(props: ActivityFormFieldsProps) {
  const t = useTranslations("activities");
  const tCategories = useTranslations("categories");
  const {
    title,
    setTitle,
    category,
    setCategory,
    plz,
    setPlz,
    description,
    setDescription,
    startAt,
    setStartAt,
  } = props;

  return (
    <>
      <div>
        <Label htmlFor="title">{t("form.titleLabel")}</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("form.titlePlaceholder")}
        />
        <div className="mt-1 text-right text-xs text-hunter">
          {title.length}/120
        </div>
      </div>

      <div>
        <Label htmlFor="category">{t("form.categoryLabel")}</Label>
        <Select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">{t("form.categoryPlaceholder")}</option>
          {ACTIVITY_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {tCategories(c as ActivityCategory)}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="plz">{t("form.postalCodeLabel")}</Label>
        <Input
          value={plz}
          onChange={(e) => setPlz(normalizePostalCodeInput(e.target.value))}
          inputMode="numeric"
          maxLength={5}
          placeholder={t("form.postalCodePlaceholder")}
        />
      </div>

      <div>
        <Label htmlFor="desc">{t("form.descriptionLabel")}</Label>
        <Textarea
          id="desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t("form.descriptionPlaceholder")}
        />
        <div className="mt-1 text-right text-xs text-hunter">
          {description.length}/2000
        </div>
      </div>

      <div>
        <Label htmlFor="startAt">{t("form.startAtLabel")}</Label>
        <Input
          id="startAt"
          type="datetime-local"
          value={startAt}
          onChange={(e) => setStartAt(e.target.value)}
        />
      </div>
    </>
  );
}
