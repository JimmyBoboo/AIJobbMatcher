import { DashboardClient } from "./dashboard-client";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background px-6 py-10">
      <main className="mx-auto max-w-3xl">
        <DashboardClient />
      </main>
    </div>
  );
}
