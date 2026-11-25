// Persoana 2 — 2.2 / 2.3 / 2.4 invitati: listare + filtre, serializare, centralizator catering
import type { Guest, Prisma, VenueTable } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ALLERGIES, MENU_TYPES, type MenuType } from "@/lib/constants";
import { parseAllergies } from "@/lib/utils";

export type GuestDTO = {
  id: string;
  fullName: string;
  phone: string | null;
  group: string | null;
  rsvpStatus: string;
  menuType: string;
  allergies: string[];
  notes: string | null;
  tableId: string | null;
  tableLabel: string | null;
  seatIndex: number | null;
};

export function toGuestDTO(g: Guest & { table?: Pick<VenueTable, "label"> | null }): GuestDTO {
  return {
    id: g.id,
    fullName: g.fullName,
    phone: g.phone,
    group: g.group,
    rsvpStatus: g.rsvpStatus,
    menuType: g.menuType,
    allergies: parseAllergies(g.allergies),
    notes: g.notes,
    tableId: g.tableId,
    tableLabel: g.table?.label ?? null,
    seatIndex: g.seatIndex,
  };
}

export type GuestFilter = {
  q?: string;
  seated?: "yes" | "no";
  menuType?: string;
  allergy?: string;
  rsvp?: string;
};

export async function listGuests(weddingId: string, f: GuestFilter = {}) {
  const where: Prisma.GuestWhereInput = { weddingId };
  if (f.q) where.OR = [{ fullName: { contains: f.q } }, { group: { contains: f.q } }, { phone: { contains: f.q } }];
  if (f.seated === "yes") where.tableId = { not: null };
  if (f.seated === "no") where.tableId = null;
  if (f.menuType) where.menuType = f.menuType;
  if (f.allergy) where.allergies = { contains: f.allergy };
  if (f.rsvp) where.rsvpStatus = f.rsvp;
  const guests = await prisma.guest.findMany({
    where,
    include: { table: { select: { label: true } } },
    orderBy: [{ group: "asc" }, { fullName: "asc" }],
  });
  return guests.map(toGuestDTO);
}

/** 2.4 Centralizator: numarari pe meniuri / alergii / mese (doar invitatii care nu au refuzat) */
export async function getCateringSummary(weddingId: string) {
  const [wedding, guests, tables] = await Promise.all([
    prisma.wedding.findUniqueOrThrow({ where: { id: weddingId } }),
    prisma.guest.findMany({
      where: { weddingId },
      include: { table: { select: { label: true } } },
      orderBy: [{ fullName: "asc" }],
    }),
    prisma.venueTable.findMany({ where: { weddingId, shape: { not: "DANCE_FLOOR" } }, orderBy: { label: "asc" } }),
  ]);

  const attending = guests.filter((g) => g.rsvpStatus !== "DECLINED");
  const menus = Object.fromEntries(MENU_TYPES.map((m) => [m, 0])) as Record<MenuType, number>;
  const allergyCounts: Record<string, number> = Object.fromEntries(ALLERGIES.map((a) => [a, 0]));
  for (const g of attending) {
    menus[g.menuType as MenuType] = (menus[g.menuType as MenuType] ?? 0) + 1;
    for (const a of parseAllergies(g.allergies)) allergyCounts[a] = (allergyCounts[a] ?? 0) + 1;
  }

  const byTable = tables.map((t) => {
    const seated = attending
      .filter((g) => g.tableId === t.id)
      .sort((a, b) => (a.seatIndex ?? 0) - (b.seatIndex ?? 0))
      .map(toGuestDTO);
    const tMenus = Object.fromEntries(MENU_TYPES.map((m) => [m, seated.filter((g) => g.menuType === m).length]));
    return { id: t.id, label: t.label, capacity: t.capacity, guests: seated, menus: tMenus };
  });

  return {
    coupleNames: wedding.coupleNames,
    weddingDate: wedding.weddingDate.toISOString(),
    venueName: wedding.venueName,
    totals: {
      invited: guests.length,
      attending: attending.length,
      confirmed: guests.filter((g) => g.rsvpStatus === "CONFIRMED").length,
      pending: guests.filter((g) => g.rsvpStatus === "PENDING").length,
      declined: guests.length - attending.length,
      seated: attending.filter((g) => g.tableId).length,
      withAllergies: attending.filter((g) => parseAllergies(g.allergies).length > 0).length,
    },
    menus,
    allergyCounts,
    byTable,
    unseated: attending.filter((g) => !g.tableId).map(toGuestDTO),
  };
}

export type CateringSummary = Awaited<ReturnType<typeof getCateringSummary>>;
