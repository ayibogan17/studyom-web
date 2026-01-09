import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";
import { normalizeRoles } from "@/lib/roles";

export const metadata = {
  title: "Yönlendiriliyor | Studyom",
  description: "Hesabınız için uygun sayfaya yönlendiriliyorsunuz.",
};

export default async function AuthRedirectPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

  const email = session.user.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    redirect("/");
  }

  const roles = normalizeRoles(user);
  const hasStudioRole = roles.includes("studio_owner");
  const hasTeacherRole = roles.includes("teacher");
  const hasProducerRole = roles.includes("producer");

  if (hasStudioRole) {
    redirect("/dashboard?as=studio&tab=calendar");
  }
  if (hasTeacherRole) {
    redirect("/teacher-panel");
  }
  if (hasProducerRole) {
    redirect("/producer-panel");
  }

  redirect("/");
}
