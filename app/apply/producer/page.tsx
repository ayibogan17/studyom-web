import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { ProducerApplyClient } from "./producer-client";

export const metadata: Metadata = {
  title: "Üretici Başvurusu | Studyom",
  description: "Prodüksiyon rolü için başvuru formu.",
};

export default async function ProducerApplyPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }
  return <ProducerApplyClient />;
}
