import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";

import { DashboardClient } from "./dashboard-client";

export const metadata: Metadata = {
  title: "Stüdyo Dashboard | Studyom",
  robots: { index: false, follow: false },
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getServerSession(authOptions);
  const search = await searchParams;
  const tabParam =
    typeof search?.tab === "string"
      ? search.tab
      : Array.isArray(search?.tab)
        ? search.tab[0]
        : null;

  if (!session?.user) {
    redirect("/login");
  }

  const bookingApprovalMode = "manual";
  const linkedTeachers: Array<{ id: string; name: string; email: string | null; image: string | null; slug: string }> = [];
  const linkedProducers: Array<{ id: string; name: string; email: string | null; image: string | null; slug: string }> = [];

  return (
    <DashboardClient
      initialStudio={undefined}
      reservationRequests={[]}
      bookingApprovalMode={bookingApprovalMode}
      initialTab={tabParam}
      userName={session.user.name ?? ""}
      userEmail={session.user.email ?? ""}
      emailVerified={Boolean((session.user as { emailVerified?: boolean }).emailVerified)}
      linkedTeachers={linkedTeachers}
      linkedProducers={linkedProducers}
    />
  );
}
