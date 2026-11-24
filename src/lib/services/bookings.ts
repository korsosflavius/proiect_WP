// Persoana 1 — 1.4 Sistemul de rezervari
// Flux: Mirii trimit cerere (PENDING) -> Furnizorul accepta (CONFIRMED) / respinge (REJECTED)
//       -> la acceptare data devine ocupata in calendar; mirii pot anula (CANCELLED).
// Anti double-booking: verificare in tranzactie + index unic filtrat in SQL Server.
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";
import { vendorAvailability } from "@/lib/services/vendors";
import type { BookingStatus } from "@/lib/constants";

const ACTIVE = ["PENDING", "CONFIRMED"];

export async function createBooking(
  weddingId: string,
  input: { vendorId: string; packageId?: string | null; notes?: string | null },
) {
  const wedding = await prisma.wedding.findUnique({ where: { id: weddingId } });
  if (!wedding) throw new ApiError(404, "Nunta nu există");
  const vendor = await prisma.vendorProfile.findUnique({
    where: { id: input.vendorId },
    include: { packages: true },
  });
  if (!vendor) throw new ApiError(404, "Furnizorul nu există");

  const pkg = input.packageId ? vendor.packages.find((p) => p.id === input.packageId) : null;
  if (input.packageId && !pkg) throw new ApiError(400, "Pachetul ales nu aparține acestui furnizor");

  const existing = await prisma.booking.findFirst({
    where: { weddingId, vendorId: vendor.id, status: { in: ACTIVE } },
  });
  if (existing) throw new ApiError(409, "Ai deja o cerere activă la acest furnizor");

  const availability = await vendorAvailability(vendor.id, wedding.weddingDate);
  if (!availability.available) {
    throw new ApiError(409, availability.booked ? "Furnizorul este deja rezervat în data nunții" : "Furnizorul nu este disponibil în data nunții");
  }

  return prisma.booking.create({
    data: {
      weddingId,
      vendorId: vendor.id,
      packageId: pkg?.id ?? null,
      eventDate: wedding.weddingDate,
      agreedPrice: pkg?.price ?? vendor.basePrice,
      notes: input.notes ?? null,
    },
  });
}

/** Recalculeaza numele salii din rezervarea VENUE confirmata a mirilor */
async function syncVenueName(tx: Prisma.TransactionClient, weddingId: string) {
  const venue = await tx.booking.findFirst({
    where: { weddingId, status: "CONFIRMED", vendor: { category: "VENUE" } },
    include: { vendor: true },
    orderBy: { updatedAt: "desc" },
  });
  await tx.wedding.update({ where: { id: weddingId }, data: { venueName: venue?.vendor.businessName ?? null } });
}

export async function updateBookingStatus(
  actor: { role: string; vendorId: string | null; weddingId: string | null },
  bookingId: string,
  status: BookingStatus,
  agreedPrice?: number,
) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId }, include: { vendor: true } });
  if (!booking) throw new ApiError(404, "Rezervarea nu există");

  const isVendor = actor.role === "VENDOR" && actor.vendorId === booking.vendorId;
  const isCouple = actor.role === "COUPLE" && actor.weddingId === booking.weddingId;
  if (!isVendor && !isCouple) throw new ApiError(403, "Nu ai acces la această rezervare");

  // reguli de tranzitie
  if (isVendor) {
    if (!["CONFIRMED", "REJECTED"].includes(status)) throw new ApiError(400, "Furnizorul poate doar accepta sau respinge");
    if (booking.status !== "PENDING") throw new ApiError(400, "Doar cererile în așteptare pot fi procesate");
  }
  if (isCouple) {
    if (status !== "CANCELLED") throw new ApiError(400, "Mirii pot doar anula o rezervare");
    if (!ACTIVE.includes(booking.status)) throw new ApiError(400, "Rezervarea nu mai este activă");
  }

  try {
    // Izolare implicita (READ COMMITTED). Garantia anti double-booking o da INDEXUL UNIC FILTRAT
    // (vendorId, eventDate) WHERE status='CONFIRMED': daca doua confirmari ruleaza simultan,
    // a doua esueaza cu P2002 -> 409. (Serializable pe SQL Server producea deadlock-uri.)
    return await prisma.$transaction(
      async (tx) => {
        if (status === "CONFIRMED") {
          const availability = await vendorAvailability(booking.vendorId, booking.eventDate, tx);
          if (availability.booked) throw new ApiError(409, "Ai deja o nuntă confirmată în această zi");
          if (availability.blocked) throw new ApiError(409, "Ziua este blocată în calendar — deblocheaz-o întâi");
        }

        // update conditionat de statusul vechi: o cerere deja procesata (ex. respinsa automat
        // de o confirmare concurenta) nu mai poate fi modificata
        const res = await tx.booking.updateMany({
          where: { id: booking.id, status: isVendor ? "PENDING" : { in: ACTIVE } },
          data: { status, ...(status === "CONFIRMED" && agreedPrice !== undefined ? { agreedPrice } : {}) },
        });
        if (res.count === 0) throw new ApiError(409, "Rezervarea a fost modificată între timp. Reîncarcă pagina.");

        if (status === "CONFIRMED") {
          // celelalte cereri pentru aceeasi zi devin automat respinse (data e ocupata)
          await tx.booking.updateMany({
            where: { vendorId: booking.vendorId, eventDate: booking.eventDate, status: "PENDING", id: { not: booking.id } },
            data: { status: "REJECTED" },
          });
        }
        if (booking.vendor.category === "VENUE") await syncVenueName(tx, booking.weddingId);
        return tx.booking.findUniqueOrThrow({ where: { id: booking.id } });
      },
      { timeout: 10_000 },
    );
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && (err.code === "P2002" || err.code === "P2034")) {
      throw new ApiError(409, "Data a fost deja ocupată de o altă rezervare");
    }
    throw err;
  }
}

export function listBookingsForWedding(weddingId: string) {
  return prisma.booking.findMany({
    where: { weddingId },
    include: { vendor: true, package: true },
    orderBy: [{ createdAt: "desc" }],
  });
}

export function listBookingsForVendor(vendorId: string) {
  return prisma.booking.findMany({
    where: { vendorId },
    include: {
      package: true,
      wedding: { include: { user: { select: { email: true } }, _count: { select: { guests: true } } } },
    },
    orderBy: [{ eventDate: "asc" }],
  });
}
