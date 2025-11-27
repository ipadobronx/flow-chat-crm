import React from "react";
import { useLocation } from "react-router-dom";
import { TabletLauncher } from "./TabletLauncher";
import { TabletPageWrapper } from "./TabletPageWrapper";

interface TabletDashboardLayoutProps {
  children: React.ReactNode;
}

export function TabletDashboardLayout({ children }: TabletDashboardLayoutProps) {
  const location = useLocation();
  
  // Show launcher on dashboard root
  const isLauncherRoute = location.pathname === "/dashboard" || location.pathname === "/dashboard/";

  if (isLauncherRoute) {
    return <TabletLauncher />;
  }

  // Wrap other pages with TabletPageWrapper
  return (
    <TabletPageWrapper>
      {children}
    </TabletPageWrapper>
  );
}
