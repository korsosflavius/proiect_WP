"use client";
// Persoana 3 — calendarul se incarca doar in browser (FullCalendar manipuleaza DOM-ul direct)
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { VendorCalendar as CalendarData } from "@/lib/services/calendar";

const VendorCalendar = dynamic(() => import("@/components/calendar/vendor-calendar").then((m) => m.VendorCalendar), {
  ssr: false,
  loading: () => (
    <div className="grid h-[600px] place-items-center rounded-2xl bg-white ring-1 ring-sand-200/80">
      <span className="inline-flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="size-4 animate-spin" /> Se încarcă calendarul...
      </span>
    </div>
  ),
});

export function VendorCalendarClient({ initial }: { initial: CalendarData }) {
  return <VendorCalendar initial={initial} />;
}
