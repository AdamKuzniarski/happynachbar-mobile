import { formatDate } from '../../src/lib/format';
import { normalizePostalCode } from '../../src/components/activities/activity-form-utils';

describe('format helpers', () => {
  test('normalizePostalCode laesst nur 5 Ziffern uebrig', () => {
    expect(normalizePostalCode(' 12345 ')).toBe('12345');
  });

  test('formatDate gibt bei undefined einen Platzhalter zurueck', () => {
    expect(formatDate(undefined)).toBe('—');
  });
});
