// Persoana 1 — 1.2 POST /api/vendors/me/packages (adaugare pachet de servicii)
import { handle, requireVendorId } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { packageSchema } from "@/lib/validators";

export async function POST(req: Request) {
  return handle(async () => {
    const vendorId = await requireVendorId();
    const data = packageSchema.parse(await req.json());
    return { package: await prisma.vendorPackage.create({ data: { ...data, vendorId } }) };
  });
}
