import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { cvSchema } from "@/lib/schemas/cv";

const USERS_COLLECTION = "users";

export async function POST(request: NextRequest) {
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
    const parsed = cvSchema.safeParse(body?.cvData ?? body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Ugyldig CV-data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    await db.collection(USERS_COLLECTION).doc(userId).update({
      cvData: parsed.data,
      cvDataUpdatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("CV save error:", err);
    return NextResponse.json(
      { error: "Kunne ikke lagre CV-data." },
      { status: 500 }
    );
  }
}
