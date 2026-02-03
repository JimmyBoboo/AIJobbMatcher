"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { CVUpload } from "@/components/cv-upload";
import type { CVData } from "@/lib/schemas/cv";

export function DashboardClient() {
  const { data: session, status } = useSession();
  const [parsedCV, setParsedCV] = useState<CVData | null>(null);

  if (status === "loading") {
    return <p className="mt-4 text-muted-foreground">Laster…</p>;
  }

  const displayName = session?.user?.name ?? session?.user?.email ?? "Bruker";

  const handleCVParsed = (data: CVData) => {
    setParsedCV(data);
    // TODO: Save CV data to Firestore for this user
    console.log("Parsed CV data:", { data });
  };

  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">Logget inn som {displayName}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          Logg ut
        </Button>
      </div>

      <CVUpload onParsed={handleCVParsed} />
    </div>
  );
}
