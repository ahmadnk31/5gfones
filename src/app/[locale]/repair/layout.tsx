import React from "react";

// This layout is the parent for all repair pages
// The component-level RepairLayout is applied in each page
export default function RepairPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
