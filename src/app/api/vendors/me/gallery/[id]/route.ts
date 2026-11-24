// Persoana 1 — 1.2 DELETE /api/vendors/me/gallery/:id
import { ApiError, handle, requireVendorId } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, ctx: RouteContext<"/api/vendors/me/gallery/[id]">) {
  return handle(async () => {
    const vendorId = await requireVendorId();
    const { id } = await ctx.params;
    const res = await prisma.vendorImage.deleteMany({ where: { id, vendorId } });
    if (res.count === 0) throw new ApiError(404, "Imaginea nu există");
    return { ok: true };
  });
}
