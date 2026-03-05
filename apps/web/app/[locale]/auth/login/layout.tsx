import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell variant="auth" showBackOnAuth={false}>{children}</AppShell>;
}
