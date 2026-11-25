// Persoana 3 — 3.3 / 3.4 Pagina calendar furnizor
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { VendorCalendarClient } from "@/components/calendar/vendor-calendar-client";
import { requirePageRole } from "@/lib/auth";
import { getVendorCalendar } from "@/lib/services/calendar";

export const metadata: Metadata = { title: "Calendar" };

export default async function VendorCalendarPage() {
  const user = await requirePageRole("VENDOR");
  const calendar = await getVendorCalendar(user.vendorId!);
  return (
    <div>
      <PageHeader
        title="Calendar disponibilitate"
        crumbs={[{ label: "Afacerea mea" }, { label: "Calendar" }]}
        description="Click pe o zi liberă pentru a o bloca, sau pe o nuntă pentru toate detaliile."
      />
      <VendorCalendarClient initial={calendar} />
    </div>
  );
}
