import type { Metadata } from "next";
import { StressView } from "@/components/stress-view";

export const metadata: Metadata = { title: "Stress test — Ready72" };

export default function StressPage() {
  return <StressView />;
}
