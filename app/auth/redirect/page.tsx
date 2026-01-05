import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/auth";
import { prisma } from "@/lib/prisma";

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
    redirect("/studyo");
  }

  const hasStudioRole = user.isStudioOwner || user.role === "STUDIO";
  const hasTeacherRole = user.isTeacher;
  const hasProducerRole = user.isProducer;

  if (hasStudioRole) {
    redirect("/dashboard?as=studio");
  }
  if (hasTeacherRole) {
    redirect("/teacher-panel");
  }
  if (hasProducerRole) {
    redirect("/producer-panel");
  }

  redirect("/studyo");
}
