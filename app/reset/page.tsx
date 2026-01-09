import { Suspense } from "react";
import { ResetClient } from "./reset-client";

export default function ResetPage() {
  return (
    <Suspense>
      <ResetClient />
    </Suspense>
  );
}
