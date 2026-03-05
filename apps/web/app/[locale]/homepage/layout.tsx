import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";

export default function HomepageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell variant="app">{children}</AppShell>;
}
