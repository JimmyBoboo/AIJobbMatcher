import { Footer } from "@/components/footer";
import { CvBuilderClient } from "@/app/dashboard/cv-builder/cv-builder-client";

export default function LagEgenCvPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6">
      <main className="mx-auto max-w-3xl">
        <CvBuilderClient />
      </main>
      <Footer />
    </div>
  );
}
