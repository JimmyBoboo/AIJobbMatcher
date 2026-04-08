import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { getAdminFirestore } from "@/lib/firebase-admin";
import { getAdminStorageBucket } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const USERS_COLLECTION = "users";
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB (samme som CV-parse i dashboard)
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const ALLOWED_EXT = [".pdf", ".docx"];

function getExtFromName(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : ".pdf";
}

function isAllowedType(type: string, ext: string): boolean {
  return (
    ALLOWED_TYPES.includes(type) ||
    (ext === ".pdf" && type.startsWith("application/")) ||
    (ext === ".docx" && type.includes("wordprocessingml"))
  );
}

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

    const formData = await request.formData();
    const file = formData.get("cv");
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Ingen fil sendt. Bruk feltet 'cv'." },
        { status: 400 }
      );
    }

    const ext = getExtFromName(file.name);
    if (!ALLOWED_EXT.includes(ext)) {
      return NextResponse.json(
        { error: "Kun PDF og DOCX er tillatt." },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Filen er for stor. Maks 5 MB." },
        { status: 400 }
      );
    }
    if (!isAllowedType(file.type, ext)) {
      return NextResponse.json(
        { error: "Ugyldig filtype. Kun PDF og DOCX er tillatt." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const storagePath = `users/${userId}/cv${ext}`;
    const bucket = getAdminStorageBucket();
    const fileRef = bucket.file(storagePath);
    await fileRef.save(buffer, {
      metadata: { contentType: file.type },
    });

    const db = getAdminFirestore();
    await db.collection(USERS_COLLECTION).doc(userId).update({
      cvStoragePath: storagePath,
      cvUploadedAt: FieldValue.serverTimestamp(),
      cvFileName: file.name,
    });

    return NextResponse.json({ ok: true, path: storagePath }, { status: 200 });
  } catch (err) {
    console.error("CV upload error:", err);
    return NextResponse.json(
      { error: "Noe gikk galt ved opplasting." },
      { status: 500 }
    );
  }
}
