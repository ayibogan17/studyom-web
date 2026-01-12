import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";

export const metadata = {
  title: "Onboarding | Studyom",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  redirect("/auth/redirect");
}
