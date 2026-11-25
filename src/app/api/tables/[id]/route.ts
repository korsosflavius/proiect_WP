// Persoana 3 — 3.1 PATCH/DELETE /api/tables/:id — salvare pozitie (posX, posY), rotatie, capacitate
import { ApiError, handle, requireWeddingId } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { tableUpdateSchema } from "@/lib/validators";

async function own(id: string, weddingId: string) {
  const t = await prisma.venueTable.findFirst({ where: { id, weddingId } });
  if (!t) throw new ApiError(404, "Masa nu există");
  return t;
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/tables/[id]">) {
  return handle(async () => {
    const weddingId = await requireWeddingId();
    const { id } = await ctx.params;
    const current = await own(id, weddingId);
    const data = tableUpdateSchema.parse(await req.json());
    const shape = data.shape ?? current.shape;
    const capacity = shape === "DANCE_FLOOR" ? 0 : (data.capacity ?? current.capacity);

    const [, table] = await prisma.$transaction([
      // daca scade capacitatea, invitatii de pe scaunele disparute sunt "ridicati"
      prisma.guest.updateMany({
        where: { tableId: id, seatIndex: { gte: capacity } },
        data: { tableId: null, seatIndex: null },
      }),
      prisma.venueTable.update({ where: { id }, data: { ...data, capacity } }),
    ]);
    return { table };
  });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/tables/[id]">) {
  return handle(async () => {
    const weddingId = await requireWeddingId();
    const { id } = await ctx.params;
    await own(id, weddingId);
    // relatia Guest->VenueTable e NoAction (SQL Server), deci ridicam explicit invitatii
    await prisma.$transaction([
      prisma.guest.updateMany({ where: { tableId: id }, data: { tableId: null, seatIndex: null } }),
      prisma.venueTable.delete({ where: { id } }),
    ]);
    return { ok: true };
  });
}
