import { ReactNode } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { useIsTablet } from "@/hooks/use-tablet";
import { TabletDashboardLayout } from "@/components/tablet/TabletDashboardLayout";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isTablet } = useIsTablet();

  // Render tablet layout for tablet devices
  if (isTablet) {
    return <TabletDashboardLayout>{children}</TabletDashboardLayout>;
  }

  // Desktop layout (unchanged)
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col">
          <TopBar />
          <main className="flex-1 overflow-y-auto">
            <div className="p-2 sm:p-3 md:p-4 lg:p-6">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
