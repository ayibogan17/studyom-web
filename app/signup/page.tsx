import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Üyelik | Studyom",
  description: "Tek hesapla Studyom'a katıl. Şehir, niyet ve şifrenle hızlıca kayıt ol.",
};

export default async function SignupPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    redirect("/auth/redirect");
  }

  return <SignupForm />;
}
