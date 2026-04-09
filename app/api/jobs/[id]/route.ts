import { NextRequest, NextResponse } from "next/server";
import { fetchPineconeJobById } from "@/lib/pinecone-fetch-job";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!id?.trim()) {
      return NextResponse.json({ error: "Mangler jobb-id" }, { status: 400 });
    }

    const job = await fetchPineconeJobById(id);
    if (!job) {
      return NextResponse.json(
        { error: "Stillingen ble ikke funnet" },
        { status: 404 },
      );
    }

    return NextResponse.json(job);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Job fetch error:", message);
    return NextResponse.json(
      { error: "Kunne ikke hente stillingen.", details: message },
      { status: 500 },
    );
  }
}
