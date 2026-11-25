// Persoana 3 — 3.3 POST/DELETE /api/vendors/me/blocked-dates — blocare / deblocare manuala a unei zile
import { z } from "zod";
import { ApiError, handle, requireVendorId } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { blockDateSchema } from "@/lib/validators";
import { parseDateOnly } from "@/lib/utils";

export async function POST(req: Request) {
  return handle(async () => {
    const vendorId = await requireVendorId();
    const { date, reason } = blockDateSchema.parse(await req.json());
    const day = parseDateOnly(date);
    const today = parseDateOnly(new Date().toISOString().slice(0, 10));
    if (day < today) throw new ApiError(400, "Nu poți bloca o zi din trecut");

    const booked = await prisma.booking.findFirst({ where: { vendorId, eventDate: day, status: "CONFIRMED" } });
    if (booked) throw new ApiError(409, "Ziua are deja o nuntă confirmată");

    const blocked = await prisma.blockedDate.upsert({
      where: { vendorId_date: { vendorId, date: day } },
      update: { reason: reason ?? null },
      create: { vendorId, date: day, reason: reason ?? null },
    });
    return { blocked };
  });
}

export async function DELETE(req: Request) {
  return handle(async () => {
    const vendorId = await requireVendorId();
    const { date } = z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(
      Object.fromEntries(new URL(req.url).searchParams.entries()),
    );
    const res = await prisma.blockedDate.deleteMany({ where: { vendorId, date: parseDateOnly(date) } });
    if (res.count === 0) throw new ApiError(404, "Ziua nu era blocată");
    return { ok: true };
  });
}
