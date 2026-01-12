import { StudioLoginForm } from "./_components/StudioLoginForm";

export const metadata = {
  title: "Stüdyo Sahibi Girişi | Studyom",
  robots: { index: false, follow: false },
};

export default function StudioLoginPage({ searchParams }: { searchParams?: { redirect?: string } }) {
  const redirect = typeof searchParams?.redirect === "string" ? searchParams.redirect : undefined;
  return <StudioLoginForm redirect={redirect} />;
}
