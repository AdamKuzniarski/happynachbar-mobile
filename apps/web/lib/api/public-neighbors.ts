import { apiFetch } from "./client";
import { buildQuery } from "../query";

export type NeighborsMetricsRes = {
  plz: string;
  windowDays: number;
  minCount: number;
  activeNeighbors: number;
  thresholdApplied: boolean;
};

export function getPublicNeighborsMetrics(params: {
  plz: string;
  days?: number;
  minCount?: number;
}) {
  const qs = buildQuery({
    plz: params.plz,
    days: params.days ?? 30,
    minCount: params.minCount ?? 3,
  });

  return apiFetch<NeighborsMetricsRes>(`/public/neighbors/metrics?${qs}`);
}
