// Persoana 2 — 2.1 Dashboard Miri: countdown, progres planificare, Tracker de Buget
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requirePageRole } from "@/lib/auth";
import { getBudgetSummary } from "@/lib/services/budget";
import { CoupleDashboard } from "@/components/couple/couple-dashboard";
import { toDateOnly } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requirePageRole("COUPLE");
  const weddingId = user.weddingId!;
  const [wedding, budget, guestTotal, guestConfirmed, guestSeated, tables] = await Promise.all([
    prisma.wedding.findUniqueOrThrow({ where: { id: weddingId } }),
    getBudgetSummary(weddingId),
    prisma.guest.count({ where: { weddingId } }),
    prisma.guest.count({ where: { weddingId, rsvpStatus: "CONFIRMED" } }),
    prisma.guest.count({ where: { weddingId, tableId: { not: null } } }),
    prisma.venueTable.count({ where: { weddingId, shape: { not: "DANCE_FLOOR" } } }),
  ]);

  return (
    <CoupleDashboard
      wedding={{
        coupleNames: wedding.coupleNames,
        weddingDate: toDateOnly(wedding.weddingDate),
        totalBudget: wedding.totalBudget,
        expectedGuests: wedding.expectedGuests,
        venueName: wedding.venueName,
        phone: wedding.phone,
      }}
      budget={budget}
      stats={{ guestTotal, guestConfirmed, guestSeated, tables }}
    />
  );
}
