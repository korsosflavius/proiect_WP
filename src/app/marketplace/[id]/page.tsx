// Persoana 1 — 1.2 Pagina de profil public a furnizorului (descriere, pret, pachete, galerie) + rezervare
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, MapPin, Phone, Sparkles, Users } from "lucide-react";
import { Card } from "@/components/ui";
import { VendorImage } from "@/components/vendors/vendor-image";
import { Gallery } from "@/components/vendors/gallery";
import { BookingPanel } from "@/components/vendors/booking-panel";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getVendorPublic, vendorAvailability } from "@/lib/services/vendors";
import { CATEGORY_META, type VendorCategory } from "@/lib/constants";
import { formatMoney, toDateOnly } from "@/lib/utils";
import { CategoryIcon } from "@/components/icons";

export async function generateMetadata({ params }: PageProps<"/marketplace/[id]">): Promise<Metadata> {
  const { id } = await params;
  const v = await prisma.vendorProfile.findUnique({ where: { id }, select: { businessName: true } });
  return { title: v?.businessName ?? "Furnizor" };
}

export default async function VendorPage({ params }: PageProps<"/marketplace/[id]">) {
  const { id } = await params;
  const vendor = await getVendorPublic(id);
  if (!vendor) notFound();
  const meta = CATEGORY_META[vendor.category as VendorCategory];

  const session = await getSession();
  const isCouple = session?.user.role === "COUPLE" && !!session.user.weddingId;

  let bookingContext = null;
  if (isCouple) {
    const wedding = await prisma.wedding.findUnique({ where: { id: session!.user.weddingId! } });
    if (wedding) {
      const [availability, existing] = await Promise.all([
        vendorAvailability(vendor.id, wedding.weddingDate),
        prisma.booking.findFirst({
          where: { weddingId: wedding.id, vendorId: vendor.id },
          orderBy: { createdAt: "desc" },
        }),
      ]);
      bookingContext = {
        weddingDate: toDateOnly(wedding.weddingDate),
        available: availability.available,
        existing: existing ? { id: existing.id, status: existing.status, agreedPrice: existing.agreedPrice } : null,
      };
    }
  }

  return (
    <div className="animate-fade-in">
      <Link href="/marketplace" className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600">
        <ArrowLeft className="size-4" /> Înapoi la marketplace
      </Link>

      <div className="relative h-64 overflow-hidden rounded-3xl shadow-lg sm:h-80">
        <VendorImage src={vendor.imageUrl} category={vendor.category} alt={vendor.businessName} className="h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white sm:p-8">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold backdrop-blur">
            <CategoryIcon category={vendor.category} className="size-3.5" /> {meta?.label}
          </span>
          <h1 className="mt-3 font-display text-4xl font-semibold">{vendor.businessName}</h1>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-white/85">
            <span className="inline-flex items-center gap-1"><MapPin className="size-4" /> {vendor.city}</span>
            <span className="inline-flex items-center gap-1"><Sparkles className="size-4" /> {vendor._count.bookings} nunți confirmate</span>
            {vendor.capacity ? (
              <span className="inline-flex items-center gap-1"><Users className="size-4" /> până la {vendor.capacity} invitați</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-semibold">Despre noi</h2>
            <p className="mt-2 whitespace-pre-line text-slate-600">{vendor.description || "Furnizorul nu a adăugat încă o descriere."}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
              {vendor.phone && <span className="inline-flex items-center gap-1.5"><Phone className="size-4" /> {vendor.phone}</span>}
              <span className="inline-flex items-center gap-1.5"><Mail className="size-4" /> {vendor.user.email}</span>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold">Pachete și prețuri</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-sand-50 p-4 ring-1 ring-sand-200/80">
                <p className="text-sm text-slate-500">Preț de bază</p>
                <p className="text-2xl font-semibold text-brand-600">{formatMoney(vendor.basePrice)}</p>
              </div>
              {vendor.packages.map((p) => (
                <div key={p.id} className="rounded-2xl p-4 ring-1 ring-brand-100 bg-brand-50/40">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{p.name}</p>
                    <p className="font-semibold text-brand-600">{formatMoney(p.price)}</p>
                  </div>
                  {p.description && <p className="mt-1 text-sm text-slate-500">{p.description}</p>}
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold">Galerie</h2>
            <Gallery images={vendor.gallery.map((g) => ({ id: g.id, url: g.url, caption: g.caption }))} category={vendor.category} />
          </Card>
        </div>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <BookingPanel
            vendor={{
              id: vendor.id,
              businessName: vendor.businessName,
              basePrice: vendor.basePrice,
              packages: vendor.packages.map((p) => ({ id: p.id, name: p.name, price: p.price })),
            }}
            context={bookingContext}
            role={session?.user.role ?? null}
          />
        </div>
      </div>
    </div>
  );
}
