// Persoana 2 — 2.1 GET/PATCH /api/wedding (profilul nuntii: miri, data, buget, nr. invitati)
import { ApiError, handle, requireWeddingId } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { weddingSchema } from "@/lib/validators";
import { parseDateOnly } from "@/lib/utils";

export async function GET() {
  return handle(async () => {
    const weddingId = await requireWeddingId();
    return { wedding: await prisma.wedding.findUnique({ where: { id: weddingId } }) };
  });
}

export async function PATCH(req: Request) {
  return handle(async () => {
    const weddingId = await requireWeddingId();
    const { weddingDate, ...rest } = weddingSchema.parse(await req.json());

    if (weddingDate) {
      // schimbarea datei nu e permisa daca exista furnizori confirmati pe data veche
      const current = await prisma.wedding.findUniqueOrThrow({ where: { id: weddingId } });
      const newDate = parseDateOnly(weddingDate);
      if (newDate.getTime() !== current.weddingDate.getTime()) {
        const active = await prisma.booking.count({ where: { weddingId, status: { in: ["PENDING", "CONFIRMED"] } } });
        if (active > 0) {
          throw new ApiError(409, "Nu poți schimba data cât timp ai rezervări active. Anulează-le întâi.");
        }
      }
    }

    const wedding = await prisma.wedding.update({
      where: { id: weddingId },
      data: { ...rest, ...(weddingDate ? { weddingDate: parseDateOnly(weddingDate) } : {}) },
    });
    return { wedding };
  });
}
