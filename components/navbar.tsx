"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Don't show navbar on login/register pages
  if (pathname === "/login" || pathname === "/register" || pathname === "/") {
    return null;
  }

  const isAuthenticated = status === "authenticated";

  const closeSheet = () => setSheetOpen(false);

  const handleSignOut = () => {
    closeSheet();
    signOut({ callbackUrl: "/" });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/90 shadow-sm backdrop-blur-md supports-backdrop-filter:bg-card/80">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand-light/50 to-transparent" />
      <div className="container relative mx-auto flex h-14 items-center px-4">
        <div className="flex flex-1 items-center justify-between gap-6 md:justify-start">
          <Link
            href="/dashboard"
            className="bg-gradient-to-r from-primary via-ai to-brand-dark bg-clip-text text-lg font-bold text-transparent dark:from-brand-light dark:via-ai-light dark:to-primary"
          >
            AI Jobb Matcher
          </Link>
          {isAuthenticated && (
            <>
              <nav className="hidden items-center gap-1 text-sm md:flex md:gap-1">
                <Link
                  href="/dashboard"
                  className={cn(
                    "rounded-lg px-3 py-2 transition-colors hover:bg-accent hover:text-accent-foreground",
                    pathname === "/dashboard"
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  Dashboard
                </Link>
                <Link
                  href="/jobs"
                  className={cn(
                    "rounded-lg px-3 py-2 transition-colors hover:bg-accent hover:text-accent-foreground",
                    pathname === "/jobs"
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  Stillinger
                </Link>
                <Link
                  href="/lag-egen-cv"
                  className={cn(
                    "rounded-lg px-3 py-2 transition-colors hover:bg-accent hover:text-accent-foreground",
                    pathname === "/lag-egen-cv"
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  Lag egen CV
                </Link>
                <Link
                  href="/profile"
                  className={cn(
                    "rounded-lg px-3 py-2 transition-colors hover:bg-accent hover:text-accent-foreground",
                    pathname === "/profile"
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  Profil
                </Link>
              </nav>
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    aria-label="Åpne meny"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[min(20rem,85vw)]">
                  <SheetHeader>
                    <SheetTitle className="sr-only">Meny</SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col gap-1 pt-4">
                    <Link
                      href="/dashboard"
                      onClick={closeSheet}
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
                        pathname === "/dashboard"
                          ? "bg-primary/10 text-primary"
                          : "text-foreground/80",
                      )}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/jobs"
                      onClick={closeSheet}
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
                        pathname === "/jobs"
                          ? "bg-primary/10 text-primary"
                          : "text-foreground/80",
                      )}
                    >
                      Stillinger
                    </Link>
                    <Link
                      href="/lag-egen-cv"
                      onClick={closeSheet}
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
                        pathname === "/lag-egen-cv"
                          ? "bg-primary/10 text-primary"
                          : "text-foreground/80",
                      )}
                    >
                      Lag egen CV
                    </Link>
                    <Link
                      href="/profile"
                      onClick={closeSheet}
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent",
                        pathname === "/profile"
                          ? "bg-primary/10 text-primary"
                          : "text-foreground/80",
                      )}
                    >
                      Profil
                    </Link>
                    <div className="flex items-center gap-1 pt-2">
                      <ThemeToggle />
                    </div>
                    <Button
                      variant="ghost"
                      className="justify-start rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
                      onClick={handleSignOut}
                    >
                      Logg ut
                    </Button>
                  </nav>
                </SheetContent>
              </Sheet>
            </>
          )}
        </div>
        {isAuthenticated && (
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="hidden md:inline-flex"
            >
              Logg ut
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
