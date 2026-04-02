import { ApiError } from '../../src/lib/api';
import { getApiErrorMessage, getInitials, validateProfileForm } from '../../src/lib/profile';

describe('profile helpers', () => {
  test('getInitials() gibt N zurück, wenn kein Name da ist', () => {
    expect(getInitials()).toBe('N');
    expect(getInitials(null)).toBe('N');
    expect(getInitials('  ')).toBe('N');
  });

  test('getInitials() nimmt bei einem Wort nur den ersten Buchstaben', () => {
    expect(getInitials('adam')).toBe('A');
  });

  test('getInitials() nimmt bei mehreren Wörtern die ersten und letzten Buchstaben', () => {
    expect(getInitials('adam kuzniarski')).toBe('AK');
    expect(getInitials('adam max kuzniarski')).toBe('AK');
  });

  test('getApiErrorMessage() gibt die ApiError-Message zurück', () => {
    const error = new ApiError({
      status: 400,
      code: 'BAD_REQUEST',
      message: 'Error',
    });

    expect(getApiErrorMessage(error, 'Fallback')).toBe('Error');
  });

  test('getApiErrorMessage() gibt bei normalen Fehlern den Fallback zurück', () => {
    expect(getApiErrorMessage(new Error('Normal error'), 'Fallback')).toBe('Fallback');
    expect(getApiErrorMessage('Fatal error', 'Fallback')).toBe('Fallback');
  });

  test('validateProfileForm() trimmt die Eingaben', () => {
    const result = validateProfileForm({
      displayName: '   Adam  ',
      plz: '   63073  ',
      bio: '  testBio  ',
    });

    expect(result.normalized).toEqual({
      displayName: 'Adam',
      plz: '63073',
      bio: 'testBio',
    });

    expect(result.errors).toEqual({
      displayName: null,
      plz: null,
      bio: null,
    });

    expect(result.isValid).toBe(true);
  });
});
