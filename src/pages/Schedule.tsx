import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { UnderDevelopment } from "@/components/UnderDevelopment";

export default function Schedule() {
  return (
    <DashboardLayout>
      <UnderDevelopment pageName="Agendamentos" />
    </DashboardLayout>
  );
}