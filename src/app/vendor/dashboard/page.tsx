// Persoana 1 — 1.4 Dashboard furnizor: cereri de rezervare (accept / respinge) + statistici
import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, Clock, Euro, Inbox } from "lucide-react";
import { PageHeader, StatCard } from "@/components/ui";
import { VendorRequests } from "@/components/vendors/vendor-requests";
import { requirePageRole } from "@/lib/auth";
import { listBookingsForVendor } from "@/lib/services/bookings";
import { formatMoney } from "@/lib/utils";
import { buttonClasses } from "@/components/ui/button-classes";

export const metadata: Metadata = { title: "Cereri de rezervare" };

export default async function VendorDashboard() {
  const user = await requirePageRole("VENDOR");
  const bookings = await listBookingsForVendor(user.vendorId!);
  const today = new Date(new Date().toISOString().slice(0, 10));

  const pending = bookings.filter((b) => b.status === "PENDING");
  const confirmed = bookings.filter((b) => b.status === "CONFIRMED");
  const upcoming = confirmed.filter((b) => b.eventDate >= today);
  const revenue = confirmed.reduce((s, b) => s + b.agreedPrice, 0);

  const rows = bookings.map((b) => ({
    id: b.id,
    status: b.status,
    agreedPrice: b.agreedPrice,
    eventDate: b.eventDate.toISOString(),
    notes: b.notes,
    packageName: b.package?.name ?? null,
    coupleNames: b.wedding.coupleNames,
    venueName: b.wedding.venueName,
    expectedGuests: b.wedding.expectedGuests,
    email: b.wedding.user.email,
    phone: b.wedding.phone,
  }));

  return (
    <div>
      <PageHeader
        title={`Salut, ${user.name}!`}
        description="Gestionează cererile de rezervare primite de la miri."
        crumbs={[{ label: "Afacerea mea" }, { label: "Cereri rezervare" }]}
        actions={
          <Link href="/vendor/calendar" className={buttonClasses("dark")}>
            Deschide calendarul
          </Link>
        }
      />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Cereri noi" value={pending.length} icon={<Inbox className="size-4" />} accent="bg-amber-50 text-amber-600 ring-amber-100" />
        <StatCard label="Nunți viitoare" value={upcoming.length} icon={<CalendarCheck className="size-4" />} accent="bg-emerald-50 text-emerald-600 ring-emerald-100" />
        <StatCard label="Venit confirmat" value={formatMoney(revenue)} icon={<Euro className="size-4" />} />
        <StatCard
          label="Rata de acceptare"
          value={`${bookings.length ? Math.round((confirmed.length / bookings.length) * 100) : 0}%`}
          icon={<Clock className="size-4" />}
          accent="bg-violet-50 text-violet-600 ring-violet-100"
        />
      </div>
      <VendorRequests bookings={rows} />
    </div>
  );
}
