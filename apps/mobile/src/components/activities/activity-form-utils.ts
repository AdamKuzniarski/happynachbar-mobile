import { ActivityCategory } from '../../lib/enums';
import type { ActivityWritePayload } from '@/lib/activities';

export const MAX_IMAGE_URLS = 5;

export function normalizePostalCode(value: string) {
  return value.replace(/\D+/g, '').slice(0, 5);
}

export function toValidDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateInput(value?: string) {
  const date = toValidDate(value);
  if (!date) return '';

  const pad = (num: number) => String(num).padStart(2, '0');
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()}`;
}

export function formatTimeInput(value?: string) {
  const date = toValidDate(value);
  if (!date) return '';

  const pad = (num: number) => String(num).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getDateFromDisplay(dateInput: string) {
  const dateValue = dateInput.trim();
  if (!dateValue) return null;

  const [dayString = '1', monthString = '1', yearString = '1970'] = dateValue.split('.');
  const parsed = new Date(
    Number(yearString),
    Number(monthString) - 1,
    Number(dayString),
    12,
    0,
    0,
    0,
  );

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getPickerBaseDate(dateInput: string, timeInput: string) {
  const validDate = getDateFromDisplay(dateInput);
  const now = new Date();
  const base = validDate ?? new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);

  const timeValue = timeInput.trim();
  if (timeValue) {
    const [hourString = '0', minuteString = '0'] = timeValue.split(':');
    const hour = Number(hourString);
    const minute = Number(minuteString);

    if (Number.isFinite(hour) && Number.isFinite(minute)) {
      base.setHours(hour, minute, 0, 0);
    }
  }

  return base;
}

export function parseStartAt(dateInput: string, timeInput: string) {
  const dateValue = dateInput.trim();
  const timeValue = timeInput.trim();

  if (!dateValue && !timeValue) {
    return { iso: undefined as string | undefined, error: null as string | null };
  }

  if (!dateValue || !timeValue) {
    return {
      iso: undefined as string | undefined,
      error: 'Bitte Datum und Uhrzeit vollständig ausfüllen.',
    };
  }

  const [dayString = '1', monthString = '1', yearString = '1970'] = dateValue.split('.');
  const [hourString = '0', minuteString = '0'] = timeValue.split(':');
  const parsed = new Date(
    Number(yearString),
    Number(monthString) - 1,
    Number(dayString),
    Number(hourString),
    Number(minuteString),
    0,
    0,
  );

  return { iso: parsed.toISOString(), error: null as string | null };
}

export function getInitialActivityFormValues(initialValues?: Partial<ActivityWritePayload>) {
  const startAt = initialValues?.startAt;

  return {
    title: initialValues?.title ?? '',
    description: initialValues?.description ?? '',
    plz: initialValues?.plz ?? '',
    category: initialValues?.category ?? ActivityCategory.OUTDOOR,
    startDateInput: formatDateInput(startAt),
    startTimeInput: formatTimeInput(startAt),
    imageUrls: initialValues?.imageUrls ?? [],
  };
}
