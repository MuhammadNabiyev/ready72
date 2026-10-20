import type { Metadata } from "next";
import { ClientOnly } from "@/components/client-only";
import { SetupView } from "@/components/setup-view";

export const metadata: Metadata = { title: "Build your plan — Ready72" };

export default function SetupPage() {
  return (
    <ClientOnly fallback={<div className="min-h-dvh" aria-busy="true" />}>
      <SetupView />
    </ClientOnly>
  );
}
