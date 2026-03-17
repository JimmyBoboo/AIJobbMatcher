"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export function AiCvCard() {
  return (
    <Link href="/lag-egen-cv" className="block transition-opacity hover:opacity-90">
      <Card className="h-full transition-colors hover:bg-muted/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Lag egen CV med AI
          </CardTitle>
          <CardDescription>
            Bygg CV-en din steg for steg med hjelp fra AI. Fyll inn erfaring, utdanning og ferdigheter.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-24 flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50">
            <Sparkles className="h-8 w-8 text-muted-foreground" />
            <span className="mt-2 text-sm font-medium text-muted-foreground">
              Kom i gang
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
