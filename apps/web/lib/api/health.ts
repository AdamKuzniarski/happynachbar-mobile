import { apiFetch } from "./client";

export type HealthRes = {
  status: string;
};

export type DBHealthRes = { status: string; usersCount: number };

export function getHealth() {
  return apiFetch<HealthRes>("/health");
}

export function getDbHealth() {
  return apiFetch<DBHealthRes>("/health/db");
}
