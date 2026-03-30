import type { ImagePickerAsset } from 'expo-image-picker';

import { apiRequest } from '@/lib/api';

type PresignResponse = {
  uploadUrl: string;
  uploadFiles: Record<string, string>;
  assetUrl?: string;
};

const ALLOWED_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

function getContentType(asset: ImagePickerAsset) {
  const mimeType = asset.mimeType;
  if (mimeType && ALLOWED_CONTENT_TYPES.includes(mimeType as (typeof ALLOWED_CONTENT_TYPES)[number])) {
    return mimeType as 'image/jpeg' | 'image/png' | 'image/webp';
  }

  const fileName = (asset.fileName ?? '').toLowerCase();
  if (fileName.endsWith('.png')) return 'image/png';
  if (fileName.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

export async function uploadActivityImage(asset: ImagePickerAsset): Promise<string> {
  if (!asset.uri) {
    throw new Error('Kein Bild ausgewählt.');
  }

  const contentType = getContentType(asset);
  const presign = await apiRequest<PresignResponse>('/uploads/presign', {
    method: 'POST',
    body: {
      kind: 'activity',
      contentType,
    },
  });

  if (!presign?.uploadUrl || !presign?.uploadFiles || !presign?.assetUrl) {
    throw new Error('Upload vorbereiten fehlgeschlagen.');
  }

  const formData = new FormData();
  for (const [key, value] of Object.entries(presign.uploadFiles)) {
    formData.append(key, value);
  }

  formData.append('file', {
    uri: asset.uri,
    name: asset.fileName ?? `activity.${contentType.split('/')[1]}`,
    type: contentType,
  } as unknown as Blob);

  const response = await fetch(presign.uploadUrl, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Bild-Upload fehlgeschlagen.');
  }

  return String(presign.assetUrl);
}
