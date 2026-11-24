// Persoana 1 — 1.2 POST /api/vendors/me/gallery (adaugare imagine in galerie)
import { ApiError, handle, requireVendorId } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { galleryImageSchema } from "@/lib/validators";

export async function POST(req: Request) {
  return handle(async () => {
    const vendorId = await requireVendorId();
    const data = galleryImageSchema.parse(await req.json());
    const count = await prisma.vendorImage.count({ where: { vendorId } });
    if (count >= 24) throw new ApiError(400, "Galeria poate avea maxim 24 de imagini");
    return { image: await prisma.vendorImage.create({ data: { ...data, vendorId } }) };
  });
}
