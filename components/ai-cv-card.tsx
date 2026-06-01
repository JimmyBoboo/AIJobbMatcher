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
    <Link
      href="/lag-egen-cv"
      className="block transition-opacity hover:opacity-95"
    >
      <Card className="h-full border-border/80 transition-all hover:border-ai/35 hover:shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-ai" />
            Lag egen CV med AI
          </CardTitle>
          <CardDescription>
            Bygg CV-en din steg for steg med hjelp fra AI. Fyll inn erfaring, utdanning og ferdigheter.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-24 flex-col items-center justify-center rounded-lg border-2 border-dashed border-ai/25 bg-gradient-to-br from-ai/[0.06] to-brand-light/[0.08]">
            <Sparkles className="h-8 w-8 text-ai/80" />
            <span className="mt-2 text-sm font-medium text-ai">
              Kom i gang
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
