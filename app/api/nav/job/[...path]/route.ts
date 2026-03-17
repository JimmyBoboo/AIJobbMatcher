import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://pam-stilling-feed.nav.no";

/**
 * Fetches a single job/vacancy detail from NAV PAM stilling feed.
 * Path must be the relative path from the feed item's "url" (e.g. api/v1/vacancies/{uuid}).
 */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path: pathSegments } = await context.params;
    if (!pathSegments?.length || pathSegments.some((s) => !s?.trim())) {
      return NextResponse.json(
        { error: "Mangler sti til stilling" },
        { status: 400 },
      );
    }

    const relativePath = pathSegments.join("/").trim();
    if (!relativePath.startsWith("api/v1/")) {
      return NextResponse.json(
        { error: "Ugyldig sti for NAV stilling" },
        { status: 400 },
      );
    }

    const apiKey = process.env.NAVPIM_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "NAV API-nøkkel er ikke konfigurert" },
        { status: 500 },
      );
    }

    const url = `${BASE_URL}/${relativePath}`;
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `NAV API feil: ${response.status}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("NAV job fetch error:", message);
    return NextResponse.json(
      { error: "Kunne ikke hente stilling fra NAV.", details: message },
      { status: 500 },
    );
  }
}
