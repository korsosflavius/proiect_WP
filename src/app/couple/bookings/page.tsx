// Persoana 1 — 1.4 Rezervarile mirilor (status + anulare)
import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { CoupleBookingsList } from "@/components/vendors/couple-bookings-list";
import { requirePageRole } from "@/lib/auth";
import { listBookingsForWedding } from "@/lib/services/bookings";
import { VENDOR_CATEGORIES } from "@/lib/constants";
import { buttonClasses } from "@/components/ui/button-classes";

export const metadata: Metadata = { title: "Rezervările mele" };

export default async function CoupleBookingsPage() {
  const user = await requirePageRole("COUPLE");
  const bookings = await listBookingsForWedding(user.weddingId!);
  const confirmedCats = new Set(bookings.filter((b) => b.status === "CONFIRMED").map((b) => b.vendor.category));

  return (
    <div>
      <PageHeader
        title="Rezervările mele"
        crumbs={[{ label: "Furnizori", href: "/marketplace" }, { label: "Rezervările mele" }]}
        description={`${confirmedCats.size} din ${VENDOR_CATEGORIES.length} categorii de furnizori confirmate`}
        actions={
          <Link href="/marketplace" className={buttonClasses("dark")}>
            + Caută furnizori
          </Link>
        }
      />
      {bookings.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ClipboardList className="size-6" />}
            title="Nicio rezervare încă"
            description="Caută furnizori în marketplace și trimite prima cerere de rezervare."
          />
        </Card>
      ) : (
        <CoupleBookingsList
          confirmedCategories={[...confirmedCats]}
          bookings={bookings.map((b) => ({
            id: b.id,
            status: b.status,
            agreedPrice: b.agreedPrice,
            eventDate: b.eventDate.toISOString(),
            notes: b.notes,
            packageName: b.package?.name ?? null,
            vendor: { id: b.vendor.id, businessName: b.vendor.businessName, category: b.vendor.category, imageUrl: b.vendor.imageUrl, city: b.vendor.city },
          }))}
        />
      )}
    </div>
  );
}
