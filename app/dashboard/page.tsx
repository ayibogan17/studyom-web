import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { authOptions } from "@/auth";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  const cookieHeader = cookies().toString();
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.AUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  const apiUrl = `${base || ""}/api/studio`;

  const studioRes = await fetch(apiUrl, {
    headers: { cookie: cookieHeader },
    cache: "no-store",
  });

  const payload = studioRes.ok ? await studioRes.json() : null;
  const initialStudio = payload?.studio;

  return (
    <DashboardClient
      initialStudio={initialStudio}
      userName={session.user.name}
      userEmail={session.user.email}
    />
  );
}
