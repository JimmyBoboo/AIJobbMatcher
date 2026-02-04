import { ProfileClient } from "./profile-client";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-background px-6 py-12">
      <main className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Profil og innstillinger
        </h1>
        <ProfileClient />
      </main>
    </div>
  );
}
