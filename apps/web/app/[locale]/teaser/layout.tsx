import * as React from "react";
import { AppShell } from "@/components/layout/AppShell";

export default function TeaserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell variant="public">{children}</AppShell>;
}
