import { Suspense } from "react";
import { AnalyzeWorkspace } from "@/components/analyze/AnalyzeWorkspace";

export default function Home() {
  return (
    <Suspense>
      <AnalyzeWorkspace />
    </Suspense>
  );
}
