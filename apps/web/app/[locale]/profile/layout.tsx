import { AppShell } from "@/components/layout/AppShell";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell variant="app">{children}</AppShell>;
}
