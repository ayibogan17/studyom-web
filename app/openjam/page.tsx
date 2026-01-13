import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import OpenJamClient from "./openjam-client";

export const metadata: Metadata = {
  title: "OpenJam | Studyom",
  description: "OpenJam ile stüdyonu seç, ekibini kur, çalmaya başla.",
};

export default async function OpenJamPage() {
  const session = await getServerSession(authOptions);
  const sessionCity = (session?.user as { city?: string | null } | undefined)?.city;
  const defaultCity = sessionCity || "İstanbul";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2a0a4d] via-[#4c1d95] to-[#7c3aed]">
      <OpenJamClient defaultCity={defaultCity} />
    </div>
  );
}
