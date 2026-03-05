import { apiFetch } from "./client";

type PresignResponse = {
  uploadUrl: string;
  uploadFiles: Record<string, string>;
  assetUrl?: string;
};

export async function uploadAvatarImage(file: File): Promise<string> {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Nur JPG, PNG oder WebP Bilder sind erlaubt.");
  }
  if (file.size > 10_000_000) {
    throw new Error("Bild ist zu groß (max. 10MB).");
  }

  const presign = await apiFetch<PresignResponse>("/uploads/presign", {
    method: "POST",
    body: JSON.stringify({
      kind: "avatar",
      contentType: file.type,
    }),
  });

  if (!presign?.uploadUrl || !presign?.uploadFiles) {
    throw new Error("Upload vorbereiten fehlgeschlagen.");
  }

  const fd = new FormData();
  for (const [k, v] of Object.entries(presign.uploadFiles)) {
    fd.append(k, String(v));
  }
  fd.append("file", file);

  const uploadRes = await fetch(presign.uploadUrl, {
    method: "POST",
    body: fd,
  });
  if (!uploadRes.ok) {
    throw new Error("Bild-Upload fehlgeschlagen.");
  }

  if (!presign.assetUrl) {
    throw new Error("Keine Asset-URL erhalten.");
  }

  return String(presign.assetUrl);
}
