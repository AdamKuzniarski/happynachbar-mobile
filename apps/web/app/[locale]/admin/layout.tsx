import * as React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { AdminShell } from "./_components/AdminShell";

const COOKIE_NAME = "happynachbar_token";

function getApiUrl() {
  return (
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:4000"
  );
}

async function assertAdmin() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) redirect("/auth/login");

  const res = await fetch(`${getApiUrl()}/admin/ping`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) redirect("/homepage");

  const data = (await res.json().catch(() => null)) as {
    ok?: boolean;
    role?: string;
  } | null;
  if (!data?.ok || data.role !== "ADMIN") redirect("/homepage");
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await assertAdmin();

  return (
    <AppShell variant="app">
      <AdminShell>{children}</AdminShell>
    </AppShell>
  );
}
