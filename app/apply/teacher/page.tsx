import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { TeacherApplyClient } from "./teacher-client";

export const metadata: Metadata = {
  title: "Öğretmen Başvurusu | Studyom",
  description: "Öğretmen rolü için başvuru formu.",
};

export default async function TeacherApplyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }
  return <TeacherApplyClient />;
}
