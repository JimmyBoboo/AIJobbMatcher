"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setIsLoading(true);
    const result = await signIn("credentials", {
      username,
      password,
      callbackUrl: "/",
      redirect: false,
    });
    setIsLoading(false);
    if (result?.error) {
      setSubmitError("Ugyldig brukernavn eller passord.");
      return;
    }
    if (result?.ok) {
      router.push("/");
      router.refresh();
    }
  }

  const error = urlError || submitError;

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Logg inn</CardTitle>
          <CardDescription>
            Skriv inn brukernavn og passord for å logge inn.
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="flex flex-col gap-4">
            {error && (
              <p className="text-sm text-destructive">
                Ugyldig brukernavn eller passord.
              </p>
            )}
            <div className="grid gap-2">
              <Label htmlFor="username">Brukernavn</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Brukernavn"
                required
                autoComplete="username"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Passord</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Passord"
                required
                autoComplete="current-password"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logger inn…" : "Logg inn"}
            </Button>
            <Button asChild variant="ghost" size="sm" className="w-full">
              <Link href="/">Tilbake</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
