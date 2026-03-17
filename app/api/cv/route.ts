import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getAdminFirestore } from "@/lib/firebase-admin";

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
    const cvStoragePath = data?.cvStoragePath as string | undefined;
    const cvUploadedAt = data?.cvUploadedAt as { toDate?: () => Date } | undefined;
    const cvFileName = data?.cvFileName as string | undefined;
    const cvData = data?.cvData as Record<string, unknown> | undefined;
    const cvDataUpdatedAt = data?.cvDataUpdatedAt as { toDate?: () => Date } | undefined;
    const cvFileHash = data?.cvFileHash as string | undefined;

    const hasCv = Boolean(cvStoragePath);
    const cvUploadedAtIso =
      cvUploadedAt?.toDate?.()?.toISOString() ?? undefined;
    const cvDataUpdatedAtIso =
      cvDataUpdatedAt?.toDate?.()?.toISOString() ?? undefined;

    return NextResponse.json({
      hasCv,
      cvUploadedAt: cvUploadedAtIso,
      cvFileName: hasCv ? cvFileName : undefined,
      cvData: cvData ?? undefined,
      cvDataUpdatedAt: cvData ? cvDataUpdatedAtIso : undefined,
      cvFileHash: cvFileHash ?? undefined,
    });
  } catch (err) {
    console.error("CV status error:", err);
    return NextResponse.json(
      { error: "Kunne ikke hente CV-status." },
      { status: 500 }
    );
  }
}
