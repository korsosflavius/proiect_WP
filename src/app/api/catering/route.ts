// Persoana 2 — 2.4 GET /api/catering — centralizator statistic (meniuri, alergii, liste pe mese)
import { handle, requireWeddingId } from "@/lib/api";
import { getCateringSummary } from "@/lib/services/guests";

export async function GET() {
  return handle(async () => {
    const weddingId = await requireWeddingId();
    return { summary: await getCateringSummary(weddingId) };
  });
}
