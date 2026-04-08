import { NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebase-admin";
import bcrypt from "bcryptjs";

const USERS_COLLECTION = "users";

const MIN_PASSWORD_LENGTH = 8;

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const passwordConfirm =
      typeof body.passwordConfirm === "string" ? body.passwordConfirm : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!email) {
      return NextResponse.json(
        { error: "E-post er påkrevd." },
        { status: 400 },
      );
    }
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Ugyldig e-postadresse." },
        { status: 400 },
      );
    }
    if (!password) {
      return NextResponse.json(
        { error: "Passord er påkrevd." },
        { status: 400 },
      );
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Passordet må være minst ${MIN_PASSWORD_LENGTH} tegn.` },
        { status: 400 },
      );
    }
    if (password !== passwordConfirm) {
      return NextResponse.json(
        { error: "Passordene matcher ikke." },
        { status: 400 },
      );
    }

    const db = getAdminFirestore();
    const normalizedEmail = email.toLowerCase();
    const existing = await db
      .collection(USERS_COLLECTION)
      .where("email", "==", normalizedEmail)
      .limit(1)
      .get();

    if (!existing.empty) {
      return NextResponse.json(
        { error: "En konto med denne e-posten finnes allerede." },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userRef = db.collection(USERS_COLLECTION).doc();
    await userRef.set({
      id: userRef.id,
      email: normalizedEmail,
      name: name || null,
      passwordHash,
    });

    return NextResponse.json(
      { message: "Bruker opprettet.", userId: userRef.id },
      { status: 201 },
    );
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json(
      { error: "Noe gikk galt. Prøv igjen." },
      { status: 500 },
    );
  }
}
