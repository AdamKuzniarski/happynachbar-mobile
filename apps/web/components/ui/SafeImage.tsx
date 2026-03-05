"use client";

import type { ImgHTMLAttributes } from "react";
import Image, { type ImageProps } from "next/image";

const CDN_BASE = process.env.NEXT_PUBLIC_CLOUDFRONT_BASE_URL;

function hostOf(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const CDN_HOST = CDN_BASE ? hostOf(CDN_BASE) : null;

type SafeImageProps = Omit<ImageProps, "src"> & {
  src: string;
};

export function SafeImage(props: SafeImageProps) {
  const {
    src,
    alt,
    className,
    fill,
    width,
    height,
    sizes,
    priority,
    quality,
    loader,
    placeholder,
    blurDataURL,
    unoptimized,
    onLoad,
    onLoadingComplete,
    ...rest
  } = props;

  const isCdn = !!CDN_HOST && hostOf(src) === CDN_HOST;

  if (isCdn) {
    return (
      <Image
        src={src}
        alt={alt}
        className={className}
        fill={fill}
        {...(!fill ? { width, height } : {})}
        sizes={sizes}
        priority={priority}
        quality={quality}
        loader={loader}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        unoptimized={unoptimized}
        onLoad={onLoad}
        onLoadingComplete={onLoadingComplete}
        {...rest}
      />
    );
  }

  // Fallback <img> with "fill" behavior + callbacks
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      width={
        !fill ? (typeof width === "number" ? width : undefined) : undefined
      }
      height={
        !fill ? (typeof height === "number" ? height : undefined) : undefined
      }
      className={[fill ? "absolute inset-0 h-full w-full" : "", className ?? ""]
        .join(" ")
        .trim()}
      onLoad={(e) => {
        onLoad?.(e);
        const img = e.currentTarget;
        onLoadingComplete?.(img);
      }}
      {...(rest as ImgHTMLAttributes<HTMLImageElement>)}
    />
  );
}
