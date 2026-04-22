import { Footer } from "@/components/footer";
import { DashboardClient } from "./dashboard-client";

export default function DashboardPage() {
  return (
    <div className="relative min-h-screen bg-background px-4 py-10 sm:px-6">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_90%_100%_at_50%_0%,rgb(37_99_235_/_0.08),transparent_65%)]"
        aria-hidden
      />
      <main className="relative mx-auto max-w-3xl">
        <DashboardClient />
      </main>
    </div>
  );
}
