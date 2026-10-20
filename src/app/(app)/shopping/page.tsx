import type { Metadata } from "next";
import { ShoppingView } from "@/components/shopping-view";

export const metadata: Metadata = { title: "Shopping list — Ready72" };

export default function ShoppingPage() {
  return <ShoppingView />;
}
