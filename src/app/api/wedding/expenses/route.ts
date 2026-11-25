// Persoana 2 — 2.1 POST /api/wedding/expenses (cheltuiala extra manuala)
import { handle, requireWeddingId } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { expenseSchema } from "@/lib/validators";

export async function GET() {
  return handle(async () => {
    const weddingId = await requireWeddingId();
    return { expenses: await prisma.budgetItem.findMany({ where: { weddingId }, orderBy: { createdAt: "desc" } }) };
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const weddingId = await requireWeddingId();
    const data = expenseSchema.parse(await req.json());
    return { expense: await prisma.budgetItem.create({ data: { ...data, weddingId } }) };
  });
}
