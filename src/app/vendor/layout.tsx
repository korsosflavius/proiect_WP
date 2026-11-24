// Persoana 1 — layout zona Furnizori (rol VENDOR obligatoriu)
import { AppShell } from "@/components/app-shell";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CATEGORY_META, type VendorCategory } from "@/lib/constants";

export default async function VendorLayout({ children }: LayoutProps<"/vendor">) {
  const user = await requirePageRole("VENDOR");
  const vendor = user.vendorId ? await prisma.vendorProfile.findUnique({ where: { id: user.vendorId } }) : null;
  return (
    <AppShell
      role="VENDOR"
      userName={vendor?.businessName ?? user.name ?? ""}
      subtitle={vendor ? CATEGORY_META[vendor.category as VendorCategory]?.label : (user.email ?? "")}
    >
      {children}
    </AppShell>
  );
}
