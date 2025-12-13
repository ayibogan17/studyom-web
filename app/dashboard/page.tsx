import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

import { authOptions } from "@/auth";
import { mockStudio } from "@/data/panelMock";
import { DashboardClient } from "./dashboard-client";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <DashboardClient
      initialStudio={mockStudio}
      userName={session.user.name}
      userEmail={session.user.email}
    />
  );
}
