import type { Metadata } from "next";
import { ToolsView } from "@/components/tools-view";

export const metadata: Metadata = { title: "Tools — Ready72" };

export default function ToolsPage() {
  return <ToolsView />;
}
