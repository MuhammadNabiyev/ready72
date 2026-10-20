import type { Metadata } from "next";
import { KitView } from "@/components/kit-view";

export const metadata: Metadata = { title: "My kit — Ready72" };

export default function KitPage() {
  return <KitView />;
}
