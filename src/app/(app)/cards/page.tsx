import type { Metadata } from "next";
import { CardsView } from "@/components/cards-view";

export const metadata: Metadata = { title: "Emergency cards — Ready72" };

export default function CardsPage() {
  return <CardsView />;
}
