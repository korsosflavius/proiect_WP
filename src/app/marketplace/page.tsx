// Persoana 1 — 1.3 Marketplace furnizori cu filtrare (categorie, pret maxim, disponibilitate pe data)
import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchX } from "lucide-react";
import { EmptyState, PageHeader } from "@/components/ui";
import { MarketplaceFilters } from "@/components/vendors/marketplace-filters";
import { VendorCard } from "@/components/vendors/vendor-card";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listVendors } from "@/lib/services/vendors";
import { vendorFilterSchema } from "@/lib/validators";
import { formatDate, toDateOnly } from "@/lib/utils";

export const metadata: Metadata = { title: "Marketplace furnizori" };

export default async function MarketplacePage({ searchParams }: PageProps<"/marketplace">) {
  const raw = await searchParams;
  const clean = Object.fromEntries(
    Object.entries(raw).filter(([, v]) => typeof v === "string" && v !== ""),
  ) as Record<string, string>;
  const parsed = vendorFilterSchema.safeParse(clean);
  const filter = parsed.success ? parsed.data : {};

  const session = await getSession();
  const wedding =
    session?.user.role === "COUPLE" && session.user.weddingId
      ? await prisma.wedding.findUnique({ where: { id: session.user.weddingId } })
      : null;
  const weddingDate = wedding ? toDateOnly(wedding.weddingDate) : null;

  const vendors = await listVendors(filter);

  return (
    <div>
      <PageHeader
        title="Marketplace furnizori"
        crumbs={[{ label: "Furnizori" }, { label: "Marketplace" }]}
        description={
          wedding
            ? `Găsește furnizorii perfecți pentru ${formatDate(wedding.weddingDate)}.`
            : "Săli, DJ, trupe, cofetării, fotografi și decoratori."
        }
      />
      <Suspense>
        <MarketplaceFilters weddingDate={weddingDate} />
      </Suspense>

      <p className="mb-4 mt-6 text-sm text-slate-500">
        <span className="font-semibold text-ink">{vendors.length}</span> furnizori găsiți
        {filter.date && <> · disponibili pe {formatDate(filter.date)}</>}
      </p>

      {vendors.length === 0 ? (
        <EmptyState
          icon={<SearchX className="size-6" />}
          title="Niciun furnizor nu corespunde filtrelor"
          description="Încearcă să mărești prețul maxim sau să alegi altă dată."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {vendors.map((v) => (
            <VendorCard key={v.id} vendor={v} available={!!filter.date && filter.date === weddingDate} />
          ))}
        </div>
      )}
    </div>
  );
}
