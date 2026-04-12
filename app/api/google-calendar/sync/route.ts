import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { syncGoogleCalendarForOwnerEmail } from "@/lib/google-calendar-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST() {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as { email?: string | null } | undefined;
  const email = sessionUser?.email?.toLowerCase();

  if (!email) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const result = await syncGoogleCalendarForOwnerEmail(email, { requireAuth: true });
  if (!result.ok) {
    return NextResponse.json(
      { code: result.code, error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result);
}
