import * as SecureStore from 'expo-secure-store';

const AUTH_TOKEN_KEY = 'authToken';

export async function getAuthToken() {
  return SecureStore.getItemAsync(AUTH_TOKEN_KEY);
}

export async function setAuthToken(token: string) {
  return SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
}

export async function clearAuthToken() {
  return SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
}
