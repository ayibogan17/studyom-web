import { Suspense } from "react";
import { LoginForm } from "./_components/LoginForm";

export const metadata = {
  title: "Giriş Yap | Studyom",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--color-secondary)]" />}>
      <LoginForm />
    </Suspense>
  );
}
