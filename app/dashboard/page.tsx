import { DashboardClient } from "./dashboard-client";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6">
      <main className="mx-auto max-w-3xl">
        <DashboardClient />
      </main>
    </div>
  );
}
