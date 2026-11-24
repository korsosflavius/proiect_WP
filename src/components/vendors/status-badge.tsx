// Persoana 1 — badge pentru statusul unei rezervari
import { Badge } from "@/components/ui";
import { BOOKING_STATUS_META, type BookingStatus } from "@/lib/constants";

export function BookingStatusBadge({ status }: { status: string }) {
  const meta = BOOKING_STATUS_META[status as BookingStatus] ?? BOOKING_STATUS_META.PENDING;
  return <Badge className={meta.className}>{meta.label}</Badge>;
}
