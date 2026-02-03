"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function DashboardClient() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <p className="mt-4 text-muted-foreground">Laster…</p>;
  }

  const displayName =
    session?.user?.name ?? session?.user?.email ?? "Bruker";

  return (
    <div className="mt-6 flex flex-col gap-2">
      <p className="text-muted-foreground">Logget inn som {displayName}</p>
      <Button variant="outline" onClick={() => signOut({ callbackUrl: "/" })}>
        Logg ut
      </Button>
    </div>
  );
}
