"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function AuthCta() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <Button size="lg" className="mt-2" disabled>
        Laster…
      </Button>
    );
  }

  if (session?.user) {
    const displayName =
      session.user.name ?? session.user.email ?? "Bruker";
    return (
      <div className="mt-2 flex flex-col items-center gap-2 sm:flex-row">
        <span className="text-muted-foreground text-sm">
          Logget inn som {displayName}
        </span>
        <Button variant="outline" size="lg" onClick={() => signOut()}>
          Logg ut
        </Button>
      </div>
    );
  }

  return (
    <Button asChild size="lg" className="mt-2">
      <Link href="/login">Logg inn</Link>
    </Button>
  );
}
