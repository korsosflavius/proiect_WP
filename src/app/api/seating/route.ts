// Persoana 3 — 3.2 POST /api/seating — asezarea unui invitat pe un scaun (drag & drop), cu SWAP
// body: { guestId, tableId, seatIndex }   (tableId = null => invitatul e ridicat de la masa)
// Daca scaunul tinta e ocupat, ocupantul ia locul vechi al invitatului tras (sau devine neasezat).
import { ApiError, handle, requireWeddingId } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { seatSchema } from "@/lib/validators";

export async function POST(req: Request) {
  return handle(async () => {
    const weddingId = await requireWeddingId();
    const { guestId, tableId, seatIndex } = seatSchema.parse(await req.json());

    return prisma.$transaction(async (tx) => {
      const guest = await tx.guest.findFirst({ where: { id: guestId, weddingId } });
      if (!guest) throw new ApiError(404, "Invitatul nu există");

      if (tableId === null || seatIndex === null) {
        await tx.guest.update({ where: { id: guest.id }, data: { tableId: null, seatIndex: null } });
        return { moved: [{ id: guest.id, tableId: null, seatIndex: null }] };
      }

      if (guest.rsvpStatus === "DECLINED") throw new ApiError(400, "Invitatul a refuzat invitația");
      const table = await tx.venueTable.findFirst({ where: { id: tableId, weddingId } });
      if (!table) throw new ApiError(404, "Masa nu există");
      if (table.shape === "DANCE_FLOOR") throw new ApiError(400, "Pe ringul de dans nu sunt scaune 🙂");
      if (seatIndex >= table.capacity) throw new ApiError(400, "Scaun inexistent");

      if (guest.tableId === tableId && guest.seatIndex === seatIndex) {
        return { moved: [] };
      }

      const occupant = await tx.guest.findFirst({ where: { tableId, seatIndex, id: { not: guest.id } } });
      const previous = { tableId: guest.tableId, seatIndex: guest.seatIndex };

      // ordinea evita conflictul cu indexul unic (tableId, seatIndex)
      await tx.guest.update({ where: { id: guest.id }, data: { tableId: null, seatIndex: null } });
      if (occupant) {
        await tx.guest.update({ where: { id: occupant.id }, data: previous });
      }
      await tx.guest.update({ where: { id: guest.id }, data: { tableId, seatIndex } });

      return {
        moved: [
          { id: guest.id, tableId, seatIndex },
          ...(occupant ? [{ id: occupant.id, ...previous }] : []),
        ],
      };
    });
  });
}
