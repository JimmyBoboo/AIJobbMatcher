"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, MapPin, Mail, Trash2 } from "lucide-react";
import type { UserProfile } from "@/lib/schemas/profile";
import type { PineconeJobRecord } from "@/lib/schemas/job-feed";

function getInitials(name: string | null | undefined, email: string | null | undefined): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email?.trim()) {
    return email.slice(0, 2).toUpperCase();
  }
  return "?";
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <Skeleton className="h-24 w-24 rounded-full" />
        <div className="flex-1 space-y-2 text-center sm:text-left">
          <Skeleton className="mx-auto h-7 w-48 sm:mx-0" />
          <Skeleton className="mx-auto h-4 w-32 sm:mx-0" />
        </div>
      </div>
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

export function ProfileClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [form, setForm] = useState<Partial<UserProfile>>({});

  const [savedJobs, setSavedJobs] = useState<PineconeJobRecord[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [savedLoading, setSavedLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarKey, setAvatarKey] = useState(0);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status !== "authenticated") return;

    let cancelled = false;
    fetch("/api/profile")
      .then((res) => {
        if (!res.ok) throw new Error("Kunne ikke hente profil");
        return res.json();
      })
      .then((data: { name?: string | null; email?: string | null; profile?: UserProfile }) => {
        if (cancelled) return;
        setName(data.name ?? null);
        setEmail(data.email ?? null);
        const p = data.profile ?? {};
        setProfile(p);
        setForm({
          username: p.username ?? "",
          bio: p.bio ?? "",
          location: p.location ?? "",
          website: p.website ?? "",
          socials: p.socials ?? {},
        });
      })
      .catch(() => {
        if (!cancelled) setProfile({});
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    setSavedLoading(true);
    fetch("/api/jobs/saved?details=1")
      .then((res) => {
        if (!res.ok) throw new Error("Kunne ikke hente lagrede stillinger");
        return res.json();
      })
      .then((data: { jobIds: string[]; jobs?: PineconeJobRecord[] }) => {
        if (cancelled) return;
        setSavedJobIds(data.jobIds ?? []);
        setSavedJobs(data.jobs ?? []);
      })
      .catch(() => {
        if (!cancelled) setSavedJobIds([]);
        if (!cancelled) setSavedJobs([]);
      })
      .finally(() => {
        if (!cancelled) setSavedLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  const handleSaveProfile = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username || undefined,
          bio: form.bio || undefined,
          location: form.location || undefined,
          website: form.website || undefined,
          socials: form.socials,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? "Kunne ikke lagre");
      }
      setProfile({
        ...profile,
        username: form.username || undefined,
        bio: form.bio || undefined,
        location: form.location || undefined,
        website: form.website || undefined,
        socials: form.socials,
      });
      setEditing(false);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Kunne ikke lagre profil");
    } finally {
      setSaving(false);
    }
  }, [form, profile]);

  const handleImportFromCv = useCallback(async () => {
    try {
      const res = await fetch("/api/cv");
      if (!res.ok) return;
      const data = await res.json();
      const summary = (data.cvData as { summary?: string } | undefined)?.summary;
      if (typeof summary === "string" && summary.trim()) {
        setForm((prev) => ({ ...prev, bio: summary.trim() }));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleAvatarUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setAvatarUploading(true);
      setAvatarError(null);
      try {
        const formData = new FormData();
        formData.set("avatar", file);
        const res = await fetch("/api/profile/avatar", {
          method: "POST",
          body: formData,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          const message = (err as { error?: string }).error ?? "Opplasting feilet";
          setAvatarError(message);
          return;
        }
        setProfile((prev) => ({
          ...prev,
          profileImageUrl: "/api/profile/avatar",
        }));
        setAvatarKey((k) => k + 1);
      } finally {
        setAvatarUploading(false);
        e.target.value = "";
      }
    },
    []
  );

  const handleRemoveAvatar = useCallback(async () => {
    setAvatarUploading(true);
    try {
      const res = await fetch("/api/profile/avatar", { method: "DELETE" });
      if (!res.ok) throw new Error("Kunne ikke fjerne");
      setProfile((prev) => {
        const next = { ...prev };
        delete next.profileImageUrl;
        return next;
      });
      setAvatarKey((k) => k + 1);
    } catch {
      // ignore
    } finally {
      setAvatarUploading(false);
    }
  }, []);

  const handleRemoveSaved = useCallback(async (jobId: string) => {
    setRemovingId(jobId);
    try {
      const res = await fetch(
        `/api/jobs/saved?jobId=${encodeURIComponent(jobId)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Kunne ikke fjerne");
      const data = await res.json();
      setSavedJobIds((data as { jobIds: string[] }).jobIds ?? []);
      setSavedJobs((prev) => prev.filter((j) => j._id !== jobId));
    } catch {
      // keep list as is
    } finally {
      setRemovingId(null);
    }
  }, []);

  if (status === "loading" || status === "unauthenticated") {
    return <ProfileSkeleton />;
  }

  if (loading) {
    return <ProfileSkeleton />;
  }

  const displayName = name ?? session?.user?.name ?? "Bruker";
  const displayEmail = email ?? session?.user?.email ?? null;

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <Avatar size="lg" className="size-32 shrink-0 sm:size-40">
              {profile?.profileImageUrl && (
                <AvatarImage
                  src={`${profile.profileImageUrl}?t=${avatarKey}`}
                  alt={displayName}
                />
              )}
              <AvatarFallback className="text-3xl sm:text-4xl">
                {getInitials(displayName, displayEmail)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-1">
              {!editing ? (
                <>
                  <h1 className="text-2xl font-semibold tracking-tight">
                    {displayName}
                  </h1>
                  {(form.username || profile?.username) && (
                    <p className="text-muted-foreground">
                      @{form.username || profile?.username}
                    </p>
                  )}
                </>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="profile-username">Brukernavn</Label>
                    <Input
                      id="profile-username"
                      value={form.username ?? ""}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, username: e.target.value }))
                      }
                      placeholder="brukernavn"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-avatar-upload">
                      Profilbilde
                    </Label>
                    <div className="flex flex-wrap items-center gap-2">
                      <Input
                        id="profile-avatar-upload"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="max-w-xs cursor-pointer"
                        disabled={avatarUploading}
                        onChange={handleAvatarUpload}
                      />
                      {profile?.profileImageUrl && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={avatarUploading}
                          onClick={handleRemoveAvatar}
                        >
                          Fjern bilde
                        </Button>
                      )}
                    </div>
                    {avatarUploading && (
                      <p className="text-sm text-muted-foreground">
                        Laster opp…
                      </p>
                    )}
                    {avatarError && (
                      <p className="text-sm text-destructive">
                        {avatarError}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {!editing ? (
            <div className="mt-6 space-y-4">
              {(profile?.bio ?? form.bio) && (
                <div>
                  <h2 className="text-sm font-medium text-muted-foreground">
                    Bio
                  </h2>
                  <p className="mt-1 whitespace-pre-wrap">
                    {profile?.bio ?? form.bio}
                  </p>
                </div>
              )}
              {(profile?.location ?? form.location) && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="size-4 shrink-0 text-muted-foreground" />
                  <span>{profile?.location ?? form.location}</span>
                </div>
              )}
              <div className="flex flex-wrap gap-4 text-sm">
                {displayEmail && (
                  <a
                    href={`mailto:${displayEmail}`}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <Mail className="size-4 shrink-0" />
                    {displayEmail}
                  </a>
                )}
                {(profile?.website ?? form.website) && (
                  <a
                    href={profile?.website ?? form.website ?? ""}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <Globe className="size-4 shrink-0" />
                    {profile?.website ?? form.website}
                  </a>
                )}
                {(profile?.socials ?? form.socials) &&
                  Object.entries(profile?.socials ?? form.socials ?? {}).map(
                    ([key, url]) =>
                      url ? (
                        <a
                          key={key}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="capitalize text-muted-foreground hover:text-foreground"
                        >
                          {key === "linkedIn" ? "LinkedIn" : key === "twitter" ? "X" : key}
                        </a>
                      ) : null
                  )}
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="profile-bio">Bio / kort beskrivelse</Label>
                <textarea
                  id="profile-bio"
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={form.bio ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, bio: e.target.value }))
                  }
                  placeholder="Kort beskrivelse eller CV-sammendrag"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleImportFromCv}
                >
                  Hent fra CV
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-location">Sted</Label>
                <Input
                  id="profile-location"
                  value={form.location ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, location: e.target.value }))
                  }
                  placeholder="F.eks. Oslo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-website">Nettsted</Label>
                <Input
                  id="profile-website"
                  type="url"
                  value={form.website ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, website: e.target.value }))
                  }
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label>Sosiale medier</Label>
                <div className="grid gap-2 sm:grid-cols-3">
                  <Input
                    placeholder="LinkedIn URL"
                    value={form.socials?.linkedIn ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        socials: {
                          ...prev.socials,
                          linkedIn: e.target.value || undefined,
                        },
                      }))
                    }
                  />
                  <Input
                    placeholder="X / Twitter URL"
                    value={form.socials?.twitter ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        socials: {
                          ...prev.socials,
                          twitter: e.target.value || undefined,
                        },
                      }))
                    }
                  />
                  <Input
                    placeholder="GitHub URL"
                    value={form.socials?.github ?? ""}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        socials: {
                          ...prev.socials,
                          github: e.target.value || undefined,
                        },
                      }))
                    }
                  />
                </div>
              </div>
              {saveError && (
                <p className="text-sm text-destructive">{saveError}</p>
              )}
              <div className="flex gap-2">
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? "Lagrer…" : "Lagre"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(false);
                    setForm({
                      username: profile?.username ?? "",
                      bio: profile?.bio ?? "",
                      location: profile?.location ?? "",
                      website: profile?.website ?? "",
                      socials: profile?.socials ?? {},
                    });
                    setSaveError(null);
                  }}
                >
                  Avbryt
                </Button>
              </div>
            </div>
          )}

          {!editing && (
            <div className="mt-6">
              <Button variant="outline" onClick={() => setEditing(true)}>
                Rediger profil
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lagrede stillinger</CardTitle>
        </CardHeader>
        <CardContent>
          {savedLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : savedJobs.length === 0 ? (
            <p className="text-muted-foreground">
              Ingen lagrede stillinger.
            </p>
          ) : (
            <ul className="space-y-2">
              {savedJobs.map((job) => (
                <li
                  key={job._id}
                  className="flex items-center justify-between gap-2 rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/jobs/${encodeURIComponent(job._id)}`}
                      className="font-medium hover:underline"
                    >
                      {job.title}
                    </Link>
                    {job.employer && (
                      <p className="text-sm text-muted-foreground">
                        {job.employer}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Fjern fra lagrede"
                    disabled={removingId === job._id}
                    onClick={() => handleRemoveSaved(job._id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
