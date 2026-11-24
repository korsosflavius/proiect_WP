// Persoana 1 — 1.3 card furnizor in Marketplace
import Link from "next/link";
import { ArrowUpRight, CalendarCheck, MapPin, Package } from "lucide-react";
import { CategoryIcon } from "@/components/icons";
import { VendorImage } from "@/components/vendors/vendor-image";
import { CATEGORY_META, type VendorCategory } from "@/lib/constants";
import { formatMoney } from "@/lib/utils";

export type VendorCardData = {
  id: string;
  businessName: string;
  category: string;
  city: string;
  basePrice: number;
  description: string;
  imageUrl: string | null;
  _count: { bookings: number; packages: number };
};

export function VendorCard({ vendor, available }: { vendor: VendorCardData; available?: boolean }) {
  const meta = CATEGORY_META[vendor.category as VendorCategory];
  return (
    <Link
      href={`/marketplace/${vendor.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)] ring-1 ring-sand-200/80 transition duration-300 hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] animate-fade-in"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-sand-100">
        <VendorImage
          src={vendor.imageUrl}
          category={vendor.category}
          alt={vendor.businessName}
          className="h-full w-full transition duration-700 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/95 px-2 py-1 text-xs font-medium text-ink shadow-[var(--shadow-xs)] backdrop-blur">
            <span style={{ color: meta?.color }}><CategoryIcon category={vendor.category} className="size-3.5" /></span>
            {meta?.label}
          </span>
          {available && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-600/95 px-2 py-1 text-xs font-medium text-white shadow-[var(--shadow-xs)]">
              <CalendarCheck className="size-3.5" /> Liber
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold leading-snug tracking-tight text-ink">{vendor.businessName}</h3>
          <ArrowUpRight className="size-4 shrink-0 text-slate-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-600" />
        </div>
        <p className="mt-1 flex items-center gap-1 text-[13px] text-slate-500">
          <MapPin className="size-3.5" /> {vendor.city}
        </p>
        <p className="mt-2.5 line-clamp-2 text-[13px] leading-relaxed text-slate-600 mb-4">
          {vendor.description || "Fără descriere încă."}
        </p>
        <div className="mt-auto flex items-end justify-between border-t border-sand-100 pt-3.5">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-400">de la</p>
            <p className="text-lg font-semibold tracking-tight text-ink tabular-nums">{formatMoney(vendor.basePrice)}</p>
          </div>
          <div className="text-right text-xs text-slate-500">
            <p>{vendor._count.bookings} nunți confirmate</p>
            {vendor._count.packages > 0 && (
              <p className="inline-flex items-center gap-1">
                <Package className="size-3" /> {vendor._count.packages} pachete
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
