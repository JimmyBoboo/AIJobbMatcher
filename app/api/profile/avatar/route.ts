import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { getAdminStorageBucket } from "@/lib/firebase-admin";

const USERS_COLLECTION = "users";
const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

function getExtFromName(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : ".jpg";
}

async function getUserId(request: NextRequest): Promise<string | null> {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  if (!token?.id || typeof token.id !== "string") return null;
  return token.id;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return new NextResponse(null, { status: 401 });
    }

    const db = getAdminFirestore();
    const userDoc = await db.collection(USERS_COLLECTION).doc(userId).get();
    const profileImagePath = userDoc.data()?.profileImagePath as
      | string
      | undefined;
    if (!profileImagePath?.trim()) {
      return new NextResponse(null, { status: 404 });
    }

    const bucket = getAdminStorageBucket();
    const file = bucket.file(profileImagePath);
    const [exists] = await file.exists();
    if (!exists) {
      return new NextResponse(null, { status: 404 });
    }

    const [buffer] = await file.download();
    const [metadata] = await file.getMetadata();
    const contentType =
      (metadata?.contentType as string) || "application/octet-stream";

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Avatar GET error:", err);
    return new NextResponse(null, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Ikke autentisert" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("avatar");
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Ingen fil sendt. Bruk feltet 'avatar'." },
        { status: 400 }
      );
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Kun bilder er tillatt (JPEG, PNG, WebP, GIF)." },
        { status: 400 }
      );
    }
    if (file.size > MAX_AVATAR_BYTES) {
      return NextResponse.json(
        { error: "Bildet er for stort. Maks 2 MB." },
        { status: 400 }
      );
    }

    const ext = getExtFromName(file.name);
    const storagePath = `users/${userId}/avatar${ext}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const bucket = getAdminStorageBucket();
    const fileRef = bucket.file(storagePath);
    await fileRef.save(buffer, {
      metadata: { contentType: file.type },
    });

    const db = getAdminFirestore();
    await db.collection(USERS_COLLECTION).doc(userId).set(
      { profileImagePath: storagePath },
      { merge: true }
    );

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Avatar upload error:", err);
    const obj = err as { code?: number; status?: number; error?: { code?: number } } | null;
    const isBucketNotFound =
      obj &&
      (obj.code === 404 ||
        obj.status === 404 ||
        obj.error?.code === 404);
    if (isBucketNotFound) {
      return NextResponse.json(
        {
          error:
            "Firebase Storage-bucket finnes ikke. Aktiver Storage i Firebase Console (Build → Storage → Get started).",
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Kunne ikke laste opp profilbilde." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Ikke autentisert" }, { status: 401 });
    }

    const db = getAdminFirestore();
    const userDoc = await db.collection(USERS_COLLECTION).doc(userId).get();
    const profileImagePath = userDoc.data()?.profileImagePath as
      | string
      | undefined;

    if (profileImagePath?.trim()) {
      const bucket = getAdminStorageBucket();
      await bucket.file(profileImagePath).delete().catch(() => {});
    }

    if (userDoc.exists) {
      await db
        .collection(USERS_COLLECTION)
        .doc(userId)
        .update({ profileImagePath: FieldValue.delete() });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Avatar DELETE error:", err);
    return NextResponse.json(
      { error: "Kunne ikke fjerne profilbilde." },
      { status: 500 }
    );
  }
}
