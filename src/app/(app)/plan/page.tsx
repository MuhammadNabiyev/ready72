import type { Metadata } from "next";
import { PlanView } from "@/components/plan-view";

export const metadata: Metadata = { title: "Family plan — Ready72" };

export default function PlanPage() {
  return <PlanView />;
}
