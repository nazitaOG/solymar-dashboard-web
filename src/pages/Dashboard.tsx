import { DashboardLayout } from "@/components/layout/dashboard-layout";

export default function Dashboard() {
  return (
    <DashboardLayout>
      <div className="p-4 md:p-6">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Bienvenido al panel.</p>
      </div>
    </DashboardLayout>
  );
}
