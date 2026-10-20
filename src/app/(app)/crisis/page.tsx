import type { Metadata } from "next";
import { CrisisView } from "@/components/crisis-view";

export const metadata: Metadata = { title: "Crisis mode — Ready72" };

export default function CrisisPage() {
  return <CrisisView />;
}
