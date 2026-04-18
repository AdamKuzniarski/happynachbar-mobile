import type { ImagePickerAsset } from 'expo-image-picker';

import { apiRequest } from '@/lib/api';
import { uploadActivityImage } from '@/lib/uploads';

jest.mock('@/lib/api', () => ({
  apiRequest: jest.fn(),
}));

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;
const mockFetch = jest.fn();

class MockFormData {
  entries: Array<[string, unknown]> = [];

  append(key: string, value: unknown) {
    this.entries.push([key, value]);
  }
}

function makeAsset(overrides: Partial<ImagePickerAsset> = {}): ImagePickerAsset {
  return {
    assetId: null,
    base64: null,
    duration: null,
    exif: null,
    fileName: 'bild.jpg',
    fileSize: 12345,
    height: 100,
    mimeType: 'image/jpeg',
    // rotation: null,
    type: null,
    uri: 'file:///tmp/bild.jpg',
    width: 100,
    ...overrides,
  } as ImagePickerAsset;
}

describe('uploadActivityImage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch as unknown as typeof fetch;
    global.FormData = MockFormData as unknown as typeof FormData;
  });

  test('wirft Fehler, wenn kein uri vorhanden ist', async () => {
    await expect(uploadActivityImage(makeAsset({ uri: '' }))).rejects.toThrow(
      'Kein Bild ausgewählt.',
    );
  });

  test('nutzt erlaubten mimeType direkt für den Presing-Request', async () => {
    mockApiRequest.mockResolvedValue({
      uploadUrl: 'https://upload.example.com',
      uploadFiles: { key: 'value' },
      assetUrl: 'https://cdn.example.com/image.jpg',
      //trzymam sie z elem jak autostrady stomil
    });

    mockFetch.mockResolvedValue({ ok: true });

    const result = await uploadActivityImage(
      makeAsset({ mimeType: 'image/jpeg', fileName: 'bild.jpg' }),
    );
    expect(result).toBe('https://cdn.example.com/image.jpg');

    expect(mockApiRequest).toHaveBeenCalledWith('/uploads/presign', {
      method: 'POST',
      body: {
        kind: 'activity',
        contentType: 'image/jpeg',
      },
    });
  });

  test('leitet contentType aus. webp-Dateiendung ab, wenn mimeType fehlt', async () => {
    mockApiRequest.mockResolvedValue({
      uploadUrl: 'https://upload.example.com',
      uploadFiles: {},
      assetUrl: 'https://cdn.example.com/image.webp',
    });

    mockFetch.mockResolvedValue({ ok: true });

    await uploadActivityImage(
      makeAsset({
        mimeType: undefined,
        fileName: 'cover.webp',
      }),
    );

    expect(mockApiRequest).toHaveBeenCalledWith('/uploads/presign', {
      method: 'POST',
      body: {
        kind: 'activity',
        contentType: 'image/webp',
      },
    });
  });
});
