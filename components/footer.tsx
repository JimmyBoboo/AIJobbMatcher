import Link from "next/link";
import { Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} AI Jobb Matcher
          </p>
          <nav className="flex items-center gap-6 text-sm">
            <Link
              href="https://github.com/AIJobbMatcher/AIJobbMatcher"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-primary"
            >
              <Github className="h-4 w-4" />
              GitHub
            </Link>
            <Link
              href="mailto:kontakt@eksempel.no"
              className="text-muted-foreground transition-colors hover:text-primary"
            >
              Kontakt
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
