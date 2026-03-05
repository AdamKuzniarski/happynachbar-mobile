"use client";

import * as React from "react";
import type { ActivityImage } from "@/lib/api/types";
import { Button } from "@/components/ui/Button";
import { SafeImage } from "@/components/ui/SafeImage";
import { useTranslations } from "next-intl";

type GalleryImage = {
  url: string;
  alt?: string;
};

type ActivityImageGalleryProps = {
  title: string;
  thumbnailUrl?: string | null;
  images?: ActivityImage[];
};

function uniqueByUrl(images: GalleryImage[]) {
  const seen = new Set<string>();
  const out: GalleryImage[] = [];
  for (const img of images) {
    if (!img.url || seen.has(img.url)) continue;
    seen.add(img.url);
    out.push(img);
  }
  return out;
}

function isPortrait(img: HTMLImageElement) {
  const w = img.naturalWidth || 0;
  const h = img.naturalHeight || 0;
  if (!w || !h) return false;
  return w / h < 1;
}

export function ActivityImageGallery({
  title,
  thumbnailUrl,
  images,
}: ActivityImageGalleryProps) {
  const t = useTranslations("activities");
  const normalizedImages: GalleryImage[] = uniqueByUrl([
    ...(thumbnailUrl ? [{ url: thumbnailUrl, alt: title }] : []),
    ...(images ?? []).map((img) => ({ url: img.url, alt: img.alt ?? title })),
  ]);

  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [heroPortrait, setHeroPortrait] = React.useState<boolean | null>(null);

  const hero = normalizedImages[0];
  const rest = normalizedImages.slice(1, 7);
  const active = normalizedImages[activeIndex] ?? hero;

  const maxIndex = normalizedImages.length - 1;
  const hasMultiple = normalizedImages.length > 1;
  const isFirst = activeIndex <= 0;
  const isLast = activeIndex >= maxIndex;

  function goNext() {
    setActiveIndex((idx) => Math.min(idx + 1, maxIndex));
  }

  function goPrev() {
    setActiveIndex((idx) => Math.max(idx - 1, 0));
  }

  React.useEffect(() => {
    if (!open || normalizedImages.length === 0) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key === "ArrowRight") {
        if (isLast) return;
        setActiveIndex((idx) => Math.min(idx + 1, maxIndex));
        return;
      }
      if (e.key === "ArrowLeft") {
        if (isFirst) return;
        setActiveIndex((idx) => Math.max(idx - 1, 0));
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, maxIndex, isFirst, isLast, normalizedImages.length]);

  if (normalizedImages.length === 0) return null;

  const heroMaxW = heroPortrait ? "420px" : "920px";
  const heroAspect = heroPortrait ? "3 / 4" : "16 / 9";

  return (
    <>
      {/* HERO */}
      <Button
        type="button"
        variant="ghost"
        className="mt-3 block w-full p-0 no-underline hover:opacity-100"
        onClick={() => {
          setActiveIndex(0);
          setOpen(true);
        }}
        aria-label={t("gallery.expandAria")}
      >
        <div className="mx-auto w-full" style={{ maxWidth: heroMaxW }}>
          <div
            className="relative w-full rounded-md overflow-hidden"
            style={{ aspectRatio: heroAspect }}
          >
            {/* blur background fills the frame */}
            <SafeImage
              src={hero.url}
              alt=""
              fill
              sizes="(max-width: 640px) 100vw, 768px"
              className="object-cover object-center scale-110 blur-xl opacity-30"
            />
            <SafeImage
              src={hero.url}
              alt={hero.alt ?? title}
              fill
              priority
              sizes="(max-width: 640px) 100vw, 768px"
              className="object-contain object-center"
              onLoadingComplete={(img) => setHeroPortrait(isPortrait(img))}
            />
          </div>
        </div>
      </Button>

      {/* THUMBNAILS */}
      {rest.length ? (
        <div className="mt-3 grid grid-cols-3 gap-2">
          {rest.map((img, idx) => (
            <Button
              key={img.url}
              type="button"
              variant="ghost"
              className="p-0 no-underline hover:opacity-100"
              onClick={() => {
                setActiveIndex(idx + 1);
                setOpen(true);
              }}
              aria-label={t("gallery.expandAria")}
            >
              <div className="relative h-20 w-full rounded-md overflow-hidden">
                <SafeImage
                  src={img.url}
                  alt={img.alt ?? title}
                  fill
                  sizes="(max-width: 640px) 33vw, 200px"
                  className="object-cover object-center"
                />
              </div>
            </Button>
          ))}
        </div>
      ) : null}

      {/* MODAL */}
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              type="button"
              variant="secondary"
              className="absolute -top-10 right-0 rounded-full border-0 bg-foreground/90 px-3 py-1 text-sm font-medium text-background hover:bg-foreground"
              onClick={() => setOpen(false)}
            >
              {t("gallery.close")}
            </Button>

            <div className="relative h-[80vh] w-full rounded-md overflow-hidden">
              {hasMultiple ? (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full border-0 bg-foreground/90 px-3 py-2 text-sm font-medium text-background hover:bg-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={goPrev}
                    disabled={isFirst}
                    aria-label={t("gallery.prev")}
                  >
                    ←
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full border-0 bg-foreground/90 px-3 py-2 text-sm font-medium text-background hover:bg-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                    onClick={goNext}
                    disabled={isLast}
                    aria-label={t("gallery.next")}
                  >
                    →
                  </Button>
                </>
              ) : null}
              <SafeImage
                src={active.url}
                alt=""
                fill
                sizes="100vw"
                className="object-cover object-center scale-110 blur-xl opacity-30"
              />
              <SafeImage
                src={active.url}
                alt={active.alt ?? title}
                fill
                sizes="100vw"
                className="object-contain object-center"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
