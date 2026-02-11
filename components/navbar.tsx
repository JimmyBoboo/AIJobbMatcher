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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-14 items-center px-4">
        <div className="flex flex-1 items-center justify-between gap-6 md:justify-start">
          <Link href="/dashboard" className="font-semibold text-lg">
            AI Jobb Matcher
          </Link>
          {isAuthenticated && (
            <>
              <nav className="hidden md:flex items-center gap-6 text-sm">
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
                        "rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                        pathname === "/dashboard"
                          ? "text-foreground bg-muted"
                          : "text-foreground/80"
                      )}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/jobs"
                      onClick={closeSheet}
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
                        pathname === "/jobs"
                          ? "text-foreground bg-muted"
                          : "text-foreground/80"
                      )}
                    >
                      Stillinger
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
