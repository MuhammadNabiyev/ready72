import type { Metadata } from "next";
import { DrillView } from "@/components/drill-view";

export const metadata: Metadata = { title: "Evacuation drill — Ready72" };

export default function DrillPage() {
  return <DrillView />;
}
