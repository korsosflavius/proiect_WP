// Persoana 1 — 1.2 Editare profil furnizor (descriere, oras, pret, pachete, galerie)
import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { VendorProfileEditor } from "@/components/vendors/vendor-profile-editor";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buttonClasses } from "@/components/ui/button-classes";

export const metadata: Metadata = { title: "Profil & prețuri" };

export default async function VendorProfilePage() {
  const user = await requirePageRole("VENDOR");
  const vendor = await prisma.vendorProfile.findUniqueOrThrow({
    where: { id: user.vendorId! },
    include: { gallery: { orderBy: { createdAt: "asc" } }, packages: { orderBy: { price: "asc" } } },
  });

  return (
    <div>
      <PageHeader
        title="Profil & prețuri"
        crumbs={[{ label: "Afacerea mea" }, { label: "Profil & prețuri" }]}
        description="Așa te văd mirii în marketplace."
        actions={
          <Link
            href={`/marketplace/${vendor.id}`}
            className={buttonClasses("secondary")}
          >
            <ExternalLink className="size-4" /> Vezi profilul public
          </Link>
        }
      />
      <VendorProfileEditor
        vendor={{
          businessName: vendor.businessName,
          category: vendor.category,
          description: vendor.description,
          city: vendor.city,
          basePrice: vendor.basePrice,
          phone: vendor.phone,
          capacity: vendor.capacity,
          imageUrl: vendor.imageUrl,
        }}
        packages={vendor.packages.map((p) => ({ id: p.id, name: p.name, description: p.description, price: p.price }))}
        gallery={vendor.gallery.map((g) => ({ id: g.id, url: g.url, caption: g.caption }))}
      />
    </div>
  );
}
