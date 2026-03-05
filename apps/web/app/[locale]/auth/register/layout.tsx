import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell variant="auth" showBackOnAuth={false}>{children}</AppShell>;
}
