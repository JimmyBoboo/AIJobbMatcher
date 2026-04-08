"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileUp, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import type { CVData } from "@/lib/schemas/cv";
import { hashCvFile } from "@/lib/cv-file-hash";

type UploadStatus = "idle" | "checking" | "uploading" | "success" | "error";

interface CVUploadProps {
  onParsed?: (data: CVData, fileHash?: string) => void;
  /** Når true: kun knapp for å erstatte CV (ingen stor opplastingskort) */
  compact?: boolean;
  /** Eksisterende CV-data – brukes for å hoppe over AI ved identisk fil */
  existingCvData?: CVData | null;
  /** Hash av sist opplastede fil – brukes for å hoppe over AI ved identisk fil */
  existingFileHash?: string | null;
}

export function CVUpload({
  onParsed,
  compact = false,
  existingCvData = null,
  existingFileHash = null,
}: CVUploadProps) {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [skippedParse, setSkippedParse] = useState(false);
  const [storageWarning, setStorageWarning] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function persistCvFileToProfile(file: File): Promise<void> {
    const formData = new FormData();
    formData.set("cv", file);
    const res = await fetch("/api/cv/upload", { method: "POST", body: formData });
    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(err.error ?? "Kunne ikke lagre CV-fil på profilen");
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      setError("Kun PDF-filer er støttet");
      setStatus("error");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Filen er for stor. Maks 10MB.");
      setStatus("error");
      return;
    }

    setFileName(file.name);
    setStatus("checking");
    setError(null);
    setStorageWarning(null);
    setSkippedParse(false);

    try {
      const fileHash = await hashCvFile(file);

      // Same file as current CV – skip AI parse and use existing data
      if (
        existingFileHash &&
        existingCvData &&
        fileHash === existingFileHash
      ) {
        setCvData(existingCvData);
        setStatus("success");
        setSkippedParse(true);
        try {
          await persistCvFileToProfile(file);
        } catch (storeErr) {
          setStorageWarning(
            storeErr instanceof Error
              ? storeErr.message
              : "Kunne ikke lagre CV-fil på profilen",
          );
        }
        onParsed?.(existingCvData, fileHash);
        if (compact) {
          setTimeout(() => handleReset(), 2000);
        }
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }

      setStatus("uploading");
      const dataUrl = await fileToDataUrl(file);

      const response = await fetch("/api/cv/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileUrl: dataUrl,
          mimeType: file.type,
          fileHash,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMsg = errorData.details
          ? `${errorData.error}: ${errorData.details}`
          : errorData.error || "Noe gikk galt";
        throw new Error(errorMsg);
      }

      const json = await response.json();
      const data = json.data as CVData;
      setCvData(data);
      setStatus("success");
      try {
        await persistCvFileToProfile(file);
      } catch (storeErr) {
        setStorageWarning(
          storeErr instanceof Error
            ? storeErr.message
            : "Kunne ikke lagre CV-fil på profilen",
        );
      }
      onParsed?.(data, fileHash);
      if (compact) {
        handleReset();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kunne ikke laste opp CV");
      setStatus("error");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Return the full data URL (e.g., "data:application/pdf;base64,...")
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleReset = () => {
    setStatus("idle");
    setError(null);
    setStorageWarning(null);
    setCvData(null);
    setFileName(null);
  };

  if (compact) {
    return (
      <div className="flex flex-col gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileSelect}
          className="hidden"
          aria-hidden
        />
        {status === "idle" && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileUp className="size-4 shrink-0" />
            Last opp ny CV
          </Button>
        )}
        {status === "checking" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Sjekker fil…
          </div>
        )}
        {status === "uploading" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Laster opp og analyserer CV…
          </div>
        )}
        {status === "success" && skippedParse && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="size-4 shrink-0" />
            Samme fil – bruker lagret CV
          </div>
        )}
        {status === "success" && storageWarning && (
          <p className="text-xs text-amber-700 dark:text-amber-500">
            {storageWarning}
          </p>
        )}
        {status === "error" && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-destructive text-sm">{error}</span>
            <Button variant="outline" size="sm" onClick={handleReset}>
              Prøv igjen
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Last opp CV</CardTitle>
        <CardDescription>
          Last opp CV-en din som PDF for å analysere den med AI
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === "idle" && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 transition-colors hover:border-muted-foreground/50 hover:bg-muted">
              <label className="flex cursor-pointer flex-col items-center gap-2">
                <FileUp className="h-8 w-8 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Klikk for å velge PDF
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">
              Maks filstørrelse: 10MB
            </p>
          </div>
        )}

        {status === "checking" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-center">
              <p className="font-medium">Sjekker fil…</p>
              <p className="text-sm text-muted-foreground">{fileName}</p>
            </div>
          </div>
        )}

        {status === "uploading" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-center">
              <p className="font-medium">Laster opp og analyserer CV…</p>
              <p className="text-sm text-muted-foreground">{fileName}</p>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4 py-4">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div className="text-center">
              <p className="font-medium text-destructive">{error}</p>
            </div>
            <Button variant="outline" onClick={handleReset}>
              Prøv igjen
            </Button>
          </div>
        )}

        {status === "success" && cvData && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">
                {skippedParse ? "Samme fil – bruker lagret CV" : "CV analysert!"}
              </span>
            </div>

            {storageWarning && (
              <p className="text-sm text-amber-700 dark:text-amber-500">
                {storageWarning}
              </p>
            )}

            <div className="rounded-lg bg-muted p-4">
              <h3 className="font-semibold">{cvData.personalInfo.name}</h3>
              {cvData.personalInfo.email && (
                <p className="text-sm text-muted-foreground">
                  {cvData.personalInfo.email}
                </p>
              )}
              {cvData.personalInfo.location && (
                <p className="text-sm text-muted-foreground">
                  {cvData.personalInfo.location}
                </p>
              )}
            </div>

            {cvData.summary && (
              <div>
                <h4 className="text-sm font-medium">Sammendrag</h4>
                <p className="text-sm text-muted-foreground">
                  {cvData.summary}
                </p>
              </div>
            )}

            {cvData.experience.length > 0 && (
              <div>
                <h4 className="text-sm font-medium">
                  Erfaring ({cvData.experience.length})
                </h4>
                <ul className="mt-1 space-y-1">
                  {cvData.experience.slice(0, 3).map((exp, i) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      {exp.title} @ {exp.company}
                    </li>
                  ))}
                  {cvData.experience.length > 3 && (
                    <li className="text-sm text-muted-foreground">
                      +{cvData.experience.length - 3} mer...
                    </li>
                  )}
                </ul>
              </div>
            )}

            {cvData.skills.length > 0 && (
              <div>
                <h4 className="text-sm font-medium">Ferdigheter</h4>
                <div className="mt-1 flex flex-wrap gap-1">
                  {cvData.skills.slice(0, 8).map((skill, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                    >
                      {skill}
                    </span>
                  ))}
                  {cvData.skills.length > 8 && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      +{cvData.skills.length - 8}
                    </span>
                  )}
                </div>
              </div>
            )}

            <Button variant="outline" onClick={handleReset} className="mt-2">
              Last opp ny CV
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
