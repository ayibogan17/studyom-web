import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { StudioNewClient } from "./studio-new-client";

export const metadata: Metadata = {
  title: "Yeni Stüdyo Başvurusu | Studyom",
  description: "Stüdyonu yayınlamak için ilk adımı at.",
};

export default async function StudioNewPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/signup");
  }

  return <StudioNewClient />;
}

