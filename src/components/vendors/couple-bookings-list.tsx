"use client";
// Persoana 1 — 1.4 lista rezervarilor mirilor cu progres pe categorii si anulare
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Button, Card, Modal } from "@/components/ui";
import { BookingStatusBadge } from "@/components/vendors/status-badge";
import { VendorImage } from "@/components/vendors/vendor-image";
import { CATEGORY_META, VENDOR_CATEGORIES, type VendorCategory } from "@/lib/constants";
import { api } from "@/lib/fetcher";
import { cn, formatDate, formatMoney } from "@/lib/utils";
import { CategoryMark } from "@/components/icons";

type B = {
  id: string;
  status: string;
  agreedPrice: number;
  eventDate: string;
  notes: string | null;
  packageName: string | null;
  vendor: { id: string; businessName: string; category: string; imageUrl: string | null; city: string };
};

export function CoupleBookingsList({ bookings, confirmedCategories }: { bookings: B[]; confirmedCategories: string[] }) {
  const router = useRouter();
  const [cancel, setCancel] = useState<B | null>(null);
  const [loading, setLoading] = useState(false);

  async function doCancel() {
    if (!cancel) return;
    setLoading(true);
    try {
      await api(`/api/bookings/${cancel.id}`, { method: "PATCH", json: { status: "CANCELLED" } });
      toast.success("Rezervarea a fost anulată");
      setCancel(null);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* checklist categorii */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {VENDOR_CATEGORIES.map((c) => {
          const done = confirmedCategories.includes(c);
          return (
            <Link
              key={c}
              href={`/marketplace?category=${c}`}
              className={cn(
                "rounded-2xl p-4 ring-1 transition hover:-translate-y-0.5",
                done ? "bg-emerald-50 ring-emerald-200" : "bg-white ring-sand-200/80 hover:ring-brand-200",
              )}
            >
              <div className="flex items-center justify-between">
                <CategoryMark category={c} />
                {done && <Check className="size-5 text-emerald-600" />}
              </div>
              <p className="mt-2 text-sm font-medium">{CATEGORY_META[c].label}</p>
              <p className="text-xs text-slate-500">{done ? "Rezervat" : "De căutat"}</p>
            </Link>
          );
        })}
      </div>

      <Card className="divide-y divide-sand-100">
        {bookings.map((b) => (
          <div key={b.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            <VendorImage src={b.vendor.imageUrl} category={b.vendor.category} alt={b.vendor.businessName} className="h-16 w-24 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/marketplace/${b.vendor.id}`} className="font-semibold hover:text-brand-600">
                  {b.vendor.businessName}
                </Link>
                <BookingStatusBadge status={b.status} />
              </div>
              <p className="text-sm text-slate-500">
                {CATEGORY_META[b.vendor.category as VendorCategory]?.label} · {b.vendor.city} · {formatDate(b.eventDate)}
                {b.packageName && <> · {b.packageName}</>}
              </p>
              {b.notes && <p className="mt-1 line-clamp-1 text-xs italic text-slate-400">„{b.notes}”</p>}
            </div>
            <div className="flex items-center gap-4">
              <p className="text-lg font-semibold">{formatMoney(b.agreedPrice)}</p>
              {["PENDING", "CONFIRMED"].includes(b.status) && (
                <Button variant="ghost" size="sm" onClick={() => setCancel(b)}>
                  Anulează
                </Button>
              )}
            </div>
          </div>
        ))}
      </Card>

      <Modal
        open={!!cancel}
        onClose={() => setCancel(null)}
        title="Anulezi rezervarea?"
        description={cancel ? `${cancel.vendor.businessName} · ${formatMoney(cancel.agreedPrice)}` : undefined}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancel(null)}>Renunță</Button>
            <Button variant="danger" loading={loading} onClick={doCancel}>Da, anulează</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Data va deveni din nou liberă în calendarul furnizorului, iar suma va fi scoasă din buget.
        </p>
      </Modal>
    </div>
  );
}
