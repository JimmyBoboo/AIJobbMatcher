import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { patchProfileSchema, type UserProfile } from "@/lib/schemas/profile";

const USERS_COLLECTION = "users";

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token?.id || typeof token.id !== "string") {
      return NextResponse.json({ error: "Ikke autentisert" }, { status: 401 });
    }
    const userId = token.id;

    const db = getAdminFirestore();
    const userDoc = await db.collection(USERS_COLLECTION).doc(userId).get();
    const data = userDoc.data();

    const name = (data?.name ?? token.name) as string | undefined;
    const email = (data?.email ?? token.email) as string | undefined;
    const profileImagePath = data?.profileImagePath as string | undefined;
    const profile: UserProfile = {
      profileImageUrl: profileImagePath?.trim()
        ? "/api/profile/avatar"
        : undefined,
      username: data?.username as string | undefined,
      bio: data?.bio as string | undefined,
      location: data?.location as string | undefined,
      website: data?.website as string | undefined,
      socials: data?.socials as UserProfile["socials"],
    };

    return NextResponse.json({
      name: name ?? null,
      email: email ?? null,
      profile,
    });
  } catch (err) {
    console.error("Profile fetch error:", err);
    return NextResponse.json(
      { error: "Kunne ikke hente profil." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token?.id || typeof token.id !== "string") {
      return NextResponse.json({ error: "Ikke autentisert" }, { status: 401 });
    }
    const userId = token.id;

    const body = await request.json();
    const parsed = patchProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ugyldige profildata", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const update: Record<string, string | object | undefined> = {};
    if (parsed.data.username !== undefined) update.username = parsed.data.username;
    if (parsed.data.bio !== undefined) update.bio = parsed.data.bio;
    if (parsed.data.location !== undefined)
      update.location = parsed.data.location;
    if (parsed.data.website !== undefined) update.website = parsed.data.website;
    if (parsed.data.socials !== undefined) update.socials = parsed.data.socials;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ ok: true });
    }

    const db = getAdminFirestore();
    await db.collection(USERS_COLLECTION).doc(userId).set(update, {
      merge: true,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Profile update error:", err);
    return NextResponse.json(
      { error: "Kunne ikke oppdatere profil." },
      { status: 500 }
    );
  }
}
