import type { Metadata } from "next";
import { ClientOnly } from "@/components/client-only";
import { ShareView } from "@/components/share-view";

export const metadata: Metadata = {
  title: "Shared plan — Ready72",
  robots: { index: false },
};

export default function SharePage() {
  return (
    <ClientOnly fallback={<div className="min-h-dvh" aria-busy="true" />}>
      <ShareView />
    </ClientOnly>
  );
}
