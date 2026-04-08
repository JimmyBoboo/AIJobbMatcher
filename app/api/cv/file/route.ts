import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { getAdminStorageBucket } from "@/lib/firebase-admin";

const USERS_COLLECTION = "users";

function sanitizeFilename(name: string, fallback: string): string {
  const base = name.trim() || fallback;
  const cleaned = base.replace(/[/\\?%*:|"<>]/g, "_").trim() || fallback;
  return cleaned.slice(0, 180);
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
    const cvStoragePath = userDoc.data()?.cvStoragePath as string | undefined;
    const cvFileName = userDoc.data()?.cvFileName as string | undefined;

    if (!cvStoragePath?.trim()) {
      return new NextResponse(null, { status: 404 });
    }

    const bucket = getAdminStorageBucket();
    const file = bucket.file(cvStoragePath);
    const [exists] = await file.exists();
    if (!exists) {
      return new NextResponse(null, { status: 404 });
    }

    const [buffer] = await file.download();
    const [metadata] = await file.getMetadata();
    const contentType =
      (metadata?.contentType as string) || "application/octet-stream";

    const inline = request.nextUrl.searchParams.get("inline") === "1";
    const disposition = inline ? "inline" : "attachment";
    const fallbackName = cvStoragePath.toLowerCase().endsWith(".docx")
      ? "cv.docx"
      : "cv.pdf";
    const downloadName = sanitizeFilename(cvFileName ?? "", fallbackName);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `${disposition}; filename="${downloadName.replace(/"/g, "_")}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("CV file GET error:", err);
    return new NextResponse(null, { status: 500 });
  }
}
