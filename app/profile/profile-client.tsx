"use client";

import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function ProfileClient() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <p className="mt-6 text-muted-foreground">Laster profil…</p>
    );
  }

  if (status !== "authenticated" || !session?.user) {
    return (
      <p className="mt-6 text-muted-foreground">
        Du må være logget inn for å se profilen.
      </p>
    );
  }

  const { name, email } = session.user;

  return (
    <div className="mt-6 flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Kontoinfo</CardTitle>
          <CardDescription>
            Din brukerinformasjon fra innlogging
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="profile-name">Navn</Label>
            <Input
              id="profile-name"
              value={name ?? ""}
              readOnly
              className="bg-muted"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="profile-email">E-post</Label>
            <Input
              id="profile-email"
              type="email"
              value={email ?? ""}
              readOnly
              className="bg-muted"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Innstillinger</CardTitle>
          <CardDescription>
            Preferanser for varsler og visning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Flere innstillinger kommer her (f.eks. e-postvarsler ved nye
            stillinger som matcher din CV).
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
