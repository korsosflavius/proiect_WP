// Persoana 2 — 2.4 Centralizator statistic pentru catering/sala + export PDF/CSV
import type { Metadata } from "next";
import { requirePageRole } from "@/lib/auth";
import { getCateringSummary } from "@/lib/services/guests";
import { CateringView } from "@/components/couple/catering-view";

export const metadata: Metadata = { title: "Catering & export" };

export default async function CateringPage() {
  const user = await requirePageRole("COUPLE");
  const summary = await getCateringSummary(user.weddingId!);
  return <CateringView summary={summary} />;
}
