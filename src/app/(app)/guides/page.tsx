import type { Metadata } from "next";
import { GuidesView } from "@/components/guides-view";

export const metadata: Metadata = { title: "Hazard guides — Ready72" };

export default function GuidesPage() {
  return <GuidesView />;
}
