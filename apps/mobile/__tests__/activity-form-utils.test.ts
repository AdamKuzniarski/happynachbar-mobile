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
    expect(toValidDate('aasad')).toBe(null);
    expect(toValidDate()).toBe(null);
  });
});
