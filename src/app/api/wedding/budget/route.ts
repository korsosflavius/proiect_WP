// Persoana 2 — 2.1 GET/PATCH /api/wedding/budget
// GET: buget total + calcul automat sume cheltuite (rezervari confirmate + cheltuieli manuale)
import { z } from "zod";
import { handle, requireWeddingId } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getBudgetSummary } from "@/lib/services/budget";

export async function GET() {
  return handle(async () => {
    const weddingId = await requireWeddingId();
    return { budget: await getBudgetSummary(weddingId) };
  });
}

export async function PATCH(req: Request) {
  return handle(async () => {
    const weddingId = await requireWeddingId();
    const { totalBudget } = z.object({ totalBudget: z.coerce.number().min(0).max(10_000_000) }).parse(await req.json());
    await prisma.wedding.update({ where: { id: weddingId }, data: { totalBudget } });
    return { budget: await getBudgetSummary(weddingId) };
  });
}
