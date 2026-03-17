import { Footer } from "@/components/footer";
import { ProfileClient } from "./profile-client";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6">
      <main className="mx-auto max-w-3xl">
        <ProfileClient />
      </main>
      <Footer />
    </div>
  );
}
