import { Suspense } from "react";
import { MainApp } from "@/components/main-app";

function MainAppFallback() {
  return (
    <div className="flex h-full min-h-[240px] items-center justify-center rounded-2xl bg-[#f2ede6]">
      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#e8e3dd] border-t-[#8b1f1f]" />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<MainAppFallback />}>
      <MainApp />
    </Suspense>
  );
}
