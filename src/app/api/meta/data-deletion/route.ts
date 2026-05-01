import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

function buildStatusUrl(confirmationCode: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "https://marketing-meta-ads.vercel.app";
  return `${base.replace(/\/$/, "")}/data-deletion?code=${confirmationCode}`;
}

export async function GET() {
  const confirmationCode = randomUUID();
  return NextResponse.json({
    url: buildStatusUrl(confirmationCode),
    confirmation_code: confirmationCode,
  });
}

export async function POST() {
  const confirmationCode = randomUUID();
  return NextResponse.json({
    url: buildStatusUrl(confirmationCode),
    confirmation_code: confirmationCode,
  });
}
