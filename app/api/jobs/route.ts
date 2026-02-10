import { NextResponse } from "next/server";

const BASE_URL = "https://pam-stilling-feed.nav.no";
const FEED_ENDPOINT = "/api/v1/feed";

export async function GET() {
  try {
    const apiKey = process.env.NAVPIM_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API key" }, { status: 500 });
    }

    // Calculate date 7 days ago for If-Modified-Since header
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const ifModifiedSince = sevenDaysAgo.toUTCString();

    const url = `${BASE_URL}${FEED_ENDPOINT}`;
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        "If-Modified-Since": ifModifiedSince,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `NAV API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
