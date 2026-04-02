import {
  formatDateInput,
  formatTimeInput,
  getInitialActivityFormValues,
  normalizePostalCode,
  parseStartAt,
  toValidDate,
} from '@/components/activities/activity-form-utils';
import { ActivityCategory } from '@/lib/enums';
//import {formatDateInput} from '../src/components/activities/activity-form-utils';

describe('activity-form-utils', () => {
  test('normalizePostalCode lässt nur Ziffern durch und schneidet auf 5-Stellen zu', () => {
    expect(normalizePostalCode('12a34-34')).toBe('12343');
    expect(normalizePostalCode('99999999')).toBe('99999');
    expect(normalizePostalCode('julia')).toBe('');
    expect(normalizePostalCode('63073')).toBe('63073');
  });

  test('toValidDate() gibt be ungültigen Wert null zurück', () => {
    expect(toValidDate('aasad')).toBeNull();
    expect(toValidDate()).toBeNull();
  });

  test('toValidDate() gibt bei gültigem Datum ein Date-Objekt zurück', () => {
    const result = toValidDate('2026-04-01T15:45:00+02:00');
    expect(result).toBeInstanceOf(Date);
    expect(result?.toISOString()).toBe('2026-04-01T13:45:00.000Z');
  });

  test('parseStartAt() gibt leer zurück, wenn Datum und Uhrzeit fehlen', () => {
    expect(parseStartAt('', '')).toEqual({
      iso: undefined,
      error: null,
    });
    expect(parseStartAt('01.04.2026', '')).toEqual({
      iso: undefined,
      error: 'Bitte Datum und Uhrzeit vollständig ausfüllen.',
    });
    expect(parseStartAt('', '15:45')).toEqual({
      iso: undefined,
      error: 'Bitte Datum und Uhrzeit vollständig ausfüllen.',
    });
  });

  test('parseStartAt() baut bei gültigen Eingaben ein ISO-Zeit-String auf', () => {
    const result = parseStartAt('01.04.2026', '15:45');

    expect(result.error).toBeNull();
    expect(result.iso).toBeDefined();
    expect(new Date(result.iso as string).toISOString()).toBe(result.iso);
  });
  test('getInitialActivityFormValues() nutzt die Default-Werte', () => {
    const result = getInitialActivityFormValues();
    expect(result).toEqual({
      title: '',
      description: '',
      plz: '',
      category: ActivityCategory.OUTDOOR,
      startDateInput: '',
      startTimeInput: '',
      imageUrls: [],
    });
  });

  test('getInitialActivityFormValues() übernimt vorhandene Werte', () => {
    const result = getInitialActivityFormValues({
      title: 'Spaziergang',
      description: 'Runde im Park',
      plz: '63073',
      category: ActivityCategory.OUTDOOR,
      startAt: '2026-04-01T15:45:00+02:00',
      imageUrls: ['https://example.com/image.jpg'],
    });

    expect(result).toEqual({
      title: 'Spaziergang',
      description: 'Runde im Park',
      plz: '63073',
      category: ActivityCategory.OUTDOOR,
      startDateInput: '01.04.2026',
      startTimeInput: '15:45',
      imageUrls: ['https://example.com/image.jpg'],
    });
  });
});
