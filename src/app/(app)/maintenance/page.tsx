import type { Metadata } from "next";
import { MaintenanceView } from "@/components/maintenance-view";

export const metadata: Metadata = { title: "Home maintenance — Ready72" };

export default function MaintenancePage() {
  return <MaintenanceView />;
}
