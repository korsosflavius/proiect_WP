// Persoana 1 — 1.2 PATCH/DELETE /api/vendors/me/packages/:id
import { ApiError, handle, requireVendorId } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { packageSchema } from "@/lib/validators";

async function own(id: string, vendorId: string) {
  const pkg = await prisma.vendorPackage.findFirst({ where: { id, vendorId } });
  if (!pkg) throw new ApiError(404, "Pachetul nu există");
  return pkg;
}

export async function PATCH(req: Request, ctx: RouteContext<"/api/vendors/me/packages/[id]">) {
  return handle(async () => {
    const vendorId = await requireVendorId();
    const { id } = await ctx.params;
    await own(id, vendorId);
    const data = packageSchema.partial().parse(await req.json());
    return { package: await prisma.vendorPackage.update({ where: { id }, data }) };
  });
}

export async function DELETE(_req: Request, ctx: RouteContext<"/api/vendors/me/packages/[id]">) {
  return handle(async () => {
    const vendorId = await requireVendorId();
    const { id } = await ctx.params;
    await own(id, vendorId);
    // rezervarile existente pastreaza pretul agreat; doar legatura cu pachetul dispare
    await prisma.$transaction([
      prisma.booking.updateMany({ where: { packageId: id }, data: { packageId: null } }),
      prisma.vendorPackage.delete({ where: { id } }),
    ]);
    return { ok: true };
  });
}
