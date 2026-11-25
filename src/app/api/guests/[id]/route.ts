// Persoana 2 — 2.2 / 2.3 PATCH/DELETE /api/guests/:id (editare date, meniu, alergii; stergere)
import { ApiError, handle, requireWeddingId } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { toGuestDTO } from "@/lib/services/guests";
import { guestUpdateSchema } from "@/lib/validators";
import { serializeAllergies } from "@/lib/utils";

async function own(id: string, weddingId: string) {
  const g = await prisma.guest.findFirst({ where: { id, weddingId } });
  if (!g) throw new ApiError(404, "Invitatul nu există");
  return g;
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/guests/[id]">) {
  return handle(async () => {
    const weddingId = await requireWeddingId();
    const { id } = await ctx.params;
    await own(id, weddingId);
    const { allergies, ...data } = guestUpdateSchema.parse(await req.json());
    const guest = await prisma.guest.update({
      where: { id },
      data: {
        ...data,
        ...(allergies ? { allergies: serializeAllergies(allergies) } : {}),
        // un invitat care refuza nu mai ocupa loc la masa
        ...(data.rsvpStatus === "DECLINED" ? { tableId: null, seatIndex: null } : {}),
      },
      include: { table: { select: { label: true } } },
    });
    return { guest: toGuestDTO(guest) };
  });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/guests/[id]">) {
  return handle(async () => {
    const weddingId = await requireWeddingId();
    const { id } = await ctx.params;
    await own(id, weddingId);
    await prisma.guest.delete({ where: { id } });
    return { ok: true };
  });
}
