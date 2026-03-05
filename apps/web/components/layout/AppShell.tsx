import * as React from "react";
import { AppHeader, type HeaderVariant } from "./AppHeader";

export function AppShell({
  variant,
  showBackOnAuth = false,
  children,
}: {
  variant: HeaderVariant;
  showBackOnAuth?: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      <AppHeader variant={variant} showBackOnAuth={showBackOnAuth} />
      {children}
    </>
  );
}
