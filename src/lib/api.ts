// Comun — helperi pentru Route Handlers: erori uniforme + verificare rol (RBAC pe API)
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth";
import type { Role } from "@/lib/constants";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Ruleaza handler-ul si transforma erorile in raspunsuri JSON */
export async function handle<T>(fn: () => Promise<T>) {
  try {
    const data = await fn();
    return NextResponse.json(data ?? { ok: true });
  } catch (err) {
    if (err instanceof ApiError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    if (err instanceof ZodError) {
      const first = err.issues[0];
      return NextResponse.json(
        { error: first ? `${first.path.join(".") || "date"}: ${first.message}` : "Date invalide", issues: err.issues },
        { status: 400 },
      );
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "Conflict: înregistrarea există deja (constrângere unică)." }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: "Eroare internă de server" }, { status: 500 });
  }
}

/** Sesiunea curenta sau 401 */
export async function requireUser() {
  const session = await getSession();
  if (!session?.user) throw new ApiError(401, "Trebuie să fii autentificat");
  return session.user;
}

/** Sesiune cu rolul cerut sau 403 */
export async function requireRole(role: Role) {
  const user = await requireUser();
  if (user.role !== role) throw new ApiError(403, "Nu ai acces la această resursă");
  return user;
}

/** Miri: id-ul nuntii din sesiune */
export async function requireWeddingId() {
  const user = await requireRole("COUPLE");
  if (!user.weddingId) throw new ApiError(400, "Profilul nunții lipsește");
  return user.weddingId;
}

/** Furnizor: id-ul profilului din sesiune */
export async function requireVendorId() {
  const user = await requireRole("VENDOR");
  if (!user.vendorId) throw new ApiError(400, "Profilul de furnizor lipsește");
  return user.vendorId;
}
