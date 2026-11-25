// Persoana 3 — 3.3 / 3.4 GET /api/vendors/me/calendar
// Rezervarile (cu detalii nunta: miri, sala, pret, nr. invitati) + zilele blocate manual
import { handle, requireVendorId } from "@/lib/api";
import { getVendorCalendar } from "@/lib/services/calendar";

export async function GET() {
  return handle(async () => {
    const vendorId = await requireVendorId();
    return { calendar: await getVendorCalendar(vendorId) };
  });
}
