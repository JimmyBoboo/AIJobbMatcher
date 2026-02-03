"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // Don't show navbar on login/register pages
  if (pathname === "/login" || pathname === "/register" || pathname === "/") {
    return null;
  }

  const isAuthenticated = status === "authenticated";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-14 items-center px-4">
        <div className="flex items-center gap-6 flex-1">
          <Link href="/dashboard" className="font-semibold text-lg">
            AI Jobb Matcher
          </Link>
          {isAuthenticated && (
            <nav className="flex items-center gap-6 text-sm">
              <Link
                href="/dashboard"
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  pathname === "/dashboard"
                    ? "text-foreground font-medium"
                    : "text-foreground/60"
                )}
              >
                Dashboard
              </Link>
              <Link
                href="/jobs"
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  pathname === "/jobs"
                    ? "text-foreground font-medium"
                    : "text-foreground/60"
                )}
              >
                Stillinger
              </Link>
            </nav>
          )}
        </div>
        {isAuthenticated && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Logg ut
          </Button>
        )}
      </div>
    </header>
  );
}
