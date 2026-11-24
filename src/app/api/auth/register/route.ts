// Persoana 1 — 1.1 POST /api/auth/register: creare cont COUPLE sau VENDOR (+ categorie)
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ApiError, handle } from "@/lib/api";
import { registerSchema } from "@/lib/validators";
import { parseDateOnly } from "@/lib/utils";

export async function POST(req: Request) {
  return handle(async () => {
    const data = registerSchema.parse(await req.json());
    const email = data.email.toLowerCase();

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) throw new ApiError(409, "Există deja un cont cu acest email");

    const passwordHash = await bcrypt.hash(data.password, 10);

    // Utilizatorul si profilul (nunta / furnizor) se creeaza atomic
    const user = await prisma.user.create({
      data: {
        email,
        name: data.name,
        passwordHash,
        role: data.role,
        ...(data.role === "COUPLE"
          ? {
              wedding: {
                create: {
                  coupleNames: data.coupleNames,
                  weddingDate: parseDateOnly(data.weddingDate),
                  totalBudget: data.totalBudget,
                  expectedGuests: data.expectedGuests,
                },
              },
            }
          : {
              vendorProfile: {
                create: {
                  businessName: data.businessName,
                  category: data.category,
                  city: data.city,
                  basePrice: data.basePrice,
                  description: "",
                },
              },
            }),
      },
      select: { id: true, email: true, role: true },
    });

    return { user };
  });
}
