import { Suspense } from "react";
import { cookies } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import { StudyoClientPage } from "./studyo-client";
import { getStudyoServerStudios } from "./studyo-server";

type SearchParams = Record<string, string | string[] | undefined>;

const hasFilterParams = (searchParams: SearchParams | undefined) => {
  if (!searchParams) return false;
  return Object.entries(searchParams).some(([key, value]) => {
    if (key === "_rsc") return false;
    if (value === undefined) return false;
    if (Array.isArray(value)) return value.some((item) => item !== "");
    return value !== "";
  });
};

export function generateMetadata({ searchParams }: { searchParams?: SearchParams }) {
  const baseUrl = "https://www.studyom.net";
  const canonical = `${baseUrl}/studyo`;
  const hasFilters = hasFilterParams(searchParams);

  return {
    title: "Stüdyo Bul | Studyom",
    description: "Şehrindeki prova ve kayıt stüdyolarını filtrele ve keşfet.",
    alternates: { canonical },
    robots: hasFilters ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title: "Stüdyo Bul | Studyom",
      description: "Şehrindeki prova ve kayıt stüdyolarını filtrele ve keşfet.",
      url: canonical,
    },
  };
}

export default async function StudioListPage() {
  const cookieStore = await cookies();
  const hasSessionCookie =
    cookieStore.has("__Secure-next-auth.session-token") ||
    cookieStore.has("__Host-next-auth.session-token") ||
    cookieStore.has("next-auth.session-token");
  const session = hasSessionCookie ? await getServerSession(authOptions) : null;
  const userEmail = session?.user?.email ?? null;
  const serverStudios = await getStudyoServerStudios(userEmail);

  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--color-secondary)]" />}>
      <StudyoClientPage serverStudios={serverStudios} />
    </Suspense>
  );
}
