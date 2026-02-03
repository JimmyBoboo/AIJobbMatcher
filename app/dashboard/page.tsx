import { DashboardClient } from "./dashboard-client";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <main className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-semibold text-foreground">
          Velkommen til dashboard
        </h1>
        <DashboardClient />
      </main>
    </div>
  );
}
