// Persoana 1 — 1.2 GET/PATCH /api/vendors/me (profilul propriu al furnizorului)
import { handle, requireVendorId } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { vendorProfileSchema } from "@/lib/validators";

export async function GET() {
  return handle(async () => {
    const vendorId = await requireVendorId();
    const vendor = await prisma.vendorProfile.findUnique({
      where: { id: vendorId },
      include: { gallery: { orderBy: { createdAt: "asc" } }, packages: { orderBy: { price: "asc" } } },
    });
    return { vendor };
  });
}

export async function PATCH(req: Request) {
  return handle(async () => {
    const vendorId = await requireVendorId();
    const data = vendorProfileSchema.partial().parse(await req.json());
    const vendor = await prisma.vendorProfile.update({
      where: { id: vendorId },
      data: { ...data, imageUrl: data.imageUrl === "" ? null : data.imageUrl },
    });
    return { vendor };
  });
}
