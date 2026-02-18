import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getAdminFirestore } from "@/lib/firebase-admin";
import type { PineconeJobRecord } from "@/lib/schemas/job-feed";

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
    const matchedJobs = data?.matchedJobs as PineconeJobRecord[] | undefined;
    const matchedJobsSavedAt = data?.matchedJobsSavedAt as
      | { toDate?: () => Date }
      | undefined;

    const savedAtIso =
      matchedJobsSavedAt?.toDate?.()?.toISOString() ?? undefined;

    return NextResponse.json({
      matches: Array.isArray(matchedJobs) ? matchedJobs : [],
      savedAt: savedAtIso,
    });
  } catch (err) {
    console.error("Matched jobs fetch error:", err);
    return NextResponse.json(
      { error: "Kunne ikke hente lagrede jobbmatcher." },
      { status: 500 }
    );
  }
}
