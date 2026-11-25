// Persoana 3 — 3.1 / 3.2 Pagina "Plan 2D Sala"
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { FloorPlannerClient } from "@/components/floorplan/floor-planner-client";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseAllergies } from "@/lib/utils";

export const metadata: Metadata = { title: "Plan 2D sală" };

export default async function FloorplanPage() {
  const user = await requirePageRole("COUPLE");
  const weddingId = user.weddingId!;
  const [wedding, tables, guests] = await Promise.all([
    prisma.wedding.findUniqueOrThrow({ where: { id: weddingId } }),
    prisma.venueTable.findMany({ where: { weddingId }, orderBy: { label: "asc" } }),
    // invitatii care au refuzat nu apar in plan
    prisma.guest.findMany({ where: { weddingId, rsvpStatus: { not: "DECLINED" } }, orderBy: { fullName: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader
        title="Planul sălii"
        crumbs={[{ label: "Planificare", href: "/couple/dashboard" }, { label: "Plan sală" }]}
        description={`${wedding.venueName ?? "Sala voastră"} · aranjează mesele și trage invitații pe scaune — totul se salvează automat.`}
      />
      <FloorPlannerClient
        initialTables={tables.map((t) => ({
          id: t.id,
          label: t.label,
          shape: t.shape,
          capacity: t.capacity,
          posX: t.posX,
          posY: t.posY,
          rotation: t.rotation,
        }))}
        initialGuests={guests.map((g) => ({
          id: g.id,
          fullName: g.fullName,
          group: g.group,
          menuType: g.menuType,
          allergies: parseAllergies(g.allergies),
          tableId: g.tableId,
          seatIndex: g.seatIndex,
        }))}
      />
    </div>
  );
}
