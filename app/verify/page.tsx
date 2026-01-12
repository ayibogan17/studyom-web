import type { Metadata } from "next";
import { Suspense } from "react";
import { VerifyClient } from "./verify-client";

export const metadata: Metadata = {
  title: "E-posta doğrulama | Studyom",
  description: "Hesabınızı doğrulamak için bağlantıyı kullanın.",
  robots: { index: false, follow: false },
};

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--color-secondary)]" />}>
      <VerifyClient />
    </Suspense>
  );
}
