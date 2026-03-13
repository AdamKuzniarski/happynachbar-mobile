import { apiRequest } from '@/lib/api';

export type HealthResponse = {
  status: string;
};

export function getHealth() {
  return apiRequest<HealthResponse>('/health');
}
