// Persoana 1 — 1.2 / 1.3 Logica de server pentru furnizori (profil + marketplace cu filtre)
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { vendorFilterSchema } from "@/lib/validators";
import { parseDateOnly } from "@/lib/utils";

export type VendorFilter = z.infer<typeof vendorFilterSchema>;

/**
 * Marketplace: filtrare dupa categorie, pret maxim, oras, text si DISPONIBILITATE pe data:
 * un furnizor e disponibil daca nu are o rezervare CONFIRMED si nici o zi blocata la acea data.
 */
export async function listVendors(filter: VendorFilter) {
  const where: Prisma.VendorProfileWhereInput = {};
  if (filter.category) where.category = filter.category;
  if (filter.maxPrice !== undefined) where.basePrice = { lte: filter.maxPrice };
  if (filter.city) where.city = { contains: filter.city };
  if (filter.q) {
    // colatia implicita SQL Server este case-insensitive
    where.OR = [{ businessName: { contains: filter.q } }, { description: { contains: filter.q } }];
  }
  if (filter.date) {
    const date = parseDateOnly(filter.date);
    where.bookings = { none: { status: "CONFIRMED", eventDate: date } };
    where.blockedDates = { none: { date } };
  }

  const orderBy: Prisma.VendorProfileOrderByWithRelationInput =
    filter.sort === "price_desc"
      ? { basePrice: "desc" }
      : filter.sort === "name"
        ? { businessName: "asc" }
        : { basePrice: "asc" };

  const vendors = await prisma.vendorProfile.findMany({
    where,
    orderBy,
    include: {
      _count: { select: { bookings: { where: { status: "CONFIRMED" } }, gallery: true, packages: true } },
      packages: { orderBy: { price: "asc" }, take: 1 },
    },
  });
  return vendors;
}

export async function getVendorPublic(id: string) {
  return prisma.vendorProfile.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      gallery: { orderBy: { createdAt: "asc" } },
      packages: { orderBy: { price: "asc" } },
      _count: { select: { bookings: { where: { status: "CONFIRMED" } } } },
    },
  });
}

/** Este furnizorul liber la data respectiva? (folosit si la rezervari) */
export async function vendorAvailability(vendorId: string, date: Date, tx: Prisma.TransactionClient = prisma) {
  const [booked, blocked] = await Promise.all([
    tx.booking.findFirst({ where: { vendorId, eventDate: date, status: "CONFIRMED" }, select: { id: true } }),
    tx.blockedDate.findFirst({ where: { vendorId, date }, select: { id: true, reason: true } }),
  ]);
  return { available: !booked && !blocked, booked: !!booked, blocked: blocked ?? null };
}
