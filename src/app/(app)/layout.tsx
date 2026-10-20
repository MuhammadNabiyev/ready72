import { AppShell } from "@/components/app-shell";
import { ClientOnly } from "@/components/client-only";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientOnly fallback={<div className="min-h-dvh" aria-busy="true" />}>
      <AppShell>{children}</AppShell>
    </ClientOnly>
  );
}
