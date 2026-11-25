// Persoana 2 — 2.1 PATCH/DELETE /api/wedding/expenses/:id
import { ApiError, handle, requireWeddingId } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { expenseSchema } from "@/lib/validators";

export async function PATCH(req: Request, ctx: RouteContext<"/api/wedding/expenses/[id]">) {
  return handle(async () => {
    const weddingId = await requireWeddingId();
    const { id } = await ctx.params;
    const data = expenseSchema.partial().parse(await req.json());
    const res = await prisma.budgetItem.updateMany({ where: { id, weddingId }, data });
    if (res.count === 0) throw new ApiError(404, "Cheltuiala nu există");
    return { ok: true };
  });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/wedding/expenses/[id]">) {
  return handle(async () => {
    const weddingId = await requireWeddingId();
    const { id } = await ctx.params;
    const res = await prisma.budgetItem.deleteMany({ where: { id, weddingId } });
    if (res.count === 0) throw new ApiError(404, "Cheltuiala nu există");
    return { ok: true };
  });
}
