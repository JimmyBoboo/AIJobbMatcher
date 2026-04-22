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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setIsLoading(true);
    const result = await signIn("credentials", {
      email,
      password,
      callbackUrl: "/dashboard",
      redirect: false,
    });
    setIsLoading(false);
    if (result?.error) {
      setSubmitError("Ugyldig e-post eller passord.");
      return;
    }
    if (result?.ok) {
      router.push("/dashboard");
      router.refresh();
    }
  }

  const error = urlError || submitError;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12 sm:px-6">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_100%_80%_at_50%_-30%,rgb(37_99_235_/_0.18),transparent_55%),radial-gradient(ellipse_70%_50%_at_100%_100%,rgb(124_58_237_/_0.12),transparent_50%),radial-gradient(ellipse_60%_40%_at_0%_100%,rgb(96_165_250_/_0.14),transparent_50%)]"
        aria-hidden
      />
      <Card className="relative w-full max-w-sm shadow-lg">
        <CardHeader>
          <CardTitle>Logg inn</CardTitle>
          <CardDescription>
            Skriv inn e-post og passord for å logge inn.
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="flex flex-col gap-4">
            {error && (
              <p className="text-sm text-destructive">
                Ugyldig e-post eller passord.
              </p>
            )}
            <div className="grid gap-2">
              <Label htmlFor="email">E-post</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="din@epost.no"
                required
                autoComplete="email"
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
          <CardFooter className="flex flex-col gap-2 mt-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Logger inn…" : "Logg inn"}
            </Button>
            <Button asChild variant="ghost" size="sm" className="w-full">
              <Link href="/register">Opprett konto</Link>
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
