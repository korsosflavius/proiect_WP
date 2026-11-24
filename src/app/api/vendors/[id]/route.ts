// Persoana 1 — 1.2 GET /api/vendors/:id (profil public furnizor)
import { ApiError, handle } from "@/lib/api";
import { getVendorPublic } from "@/lib/services/vendors";

export async function GET(_req: Request, ctx: RouteContext<"/api/vendors/[id]">) {
  return handle(async () => {
    const { id } = await ctx.params;
    const vendor = await getVendorPublic(id);
    if (!vendor) throw new ApiError(404, "Furnizorul nu există");
    return { vendor };
  });
}
