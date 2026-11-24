"use client";
// Persoana 1 — 1.1 Inregistrare cu alegere rol (Miri vs. Furnizor + una din cele 6 categorii)
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { Heart, Store } from "lucide-react";
import { Button, Field, Input } from "@/components/ui";
import { CATEGORY_META, VENDOR_CATEGORIES, type VendorCategory } from "@/lib/constants";
import { api } from "@/lib/fetcher";
import { cn } from "@/lib/utils";
import { CategoryMark } from "@/components/icons";

type Role = "COUPLE" | "VENDOR";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("COUPLE");
  const [category, setCategory] = useState<VendorCategory>("VENUE");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.currentTarget)) as Record<string, string>;
    setLoading(true);
    try {
      await api("/api/auth/register", { method: "POST", json: { ...form, role, category } });
      const res = await signIn("credentials", { email: form.email, password: form.password, redirect: false });
      if (res?.error) throw new Error("Contul a fost creat, dar autentificarea a eșuat");
      toast.success("Cont creat! Bun venit în WedCraft");
      router.push(role === "VENDOR" ? "/vendor/profile" : "/couple/dashboard");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-[28px] font-semibold tracking-tight">Creează cont</h1>
      <p className="mt-1.5 text-[15px] text-slate-500">Alege cum vei folosi WedCraft.</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {(
          [
            { r: "COUPLE", icon: Heart, title: "Suntem mirii", text: "Planificăm nunta" },
            { r: "VENDOR", icon: Store, title: "Sunt furnizor", text: "Ofer servicii" },
          ] as const
        ).map(({ r, icon: Icon, title, text }) => (
          <button
            key={r}
            type="button"
            onClick={() => setRole(r)}
            className={cn(
              "relative rounded-xl p-4 text-left transition",
              role === r
                ? "bg-white shadow-[var(--shadow-card)] ring-2 ring-brand-600"
                : "bg-white ring-1 ring-sand-200 hover:ring-sand-300",
            )}
          >
            <span className={cn("grid size-9 place-items-center rounded-lg", role === r ? "bg-brand-50 text-brand-600" : "bg-sand-100 text-slate-500")}>
              <Icon className="size-[18px]" />
            </span>
            <p className="mt-3 text-sm font-semibold">{title}</p>
            <p className="text-xs text-slate-500">{text}</p>
            <span className={cn("absolute right-3 top-3 grid size-4 place-items-center rounded-full ring-1", role === r ? "bg-brand-600 ring-brand-600" : "ring-sand-300")}>
              {role === r && <span className="size-1.5 rounded-full bg-white" />}
            </span>
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Numele tău">
            <Input name="name" required minLength={2} placeholder="Andrei Pop" />
          </Field>
          <Field label="Email">
            <Input name="email" type="email" required placeholder="nume@exemplu.ro" />
          </Field>
        </div>
        <Field label="Parolă" hint="Minim 6 caractere">
          <Input name="password" type="password" required minLength={6} placeholder="••••••••" />
        </Field>

        {role === "COUPLE" ? (
          <div key="couple" className="space-y-4 animate-fade-in">
            <Field label="Numele mirilor">
              <Input name="coupleNames" required placeholder="Andrei & Maria" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Data nunții">
                <Input name="weddingDate" type="date" required min={new Date().toISOString().slice(0, 10)} />
              </Field>
              <Field label="Buget (€)">
                <Input name="totalBudget" type="number" min={0} step={100} required defaultValue={20000} />
              </Field>
              <Field label="Nr. invitați">
                <Input name="expectedGuests" type="number" min={1} required defaultValue={100} />
              </Field>
            </div>
          </div>
        ) : (
          <div key="vendor" className="space-y-4 animate-fade-in">
            <div>
              <p className="mb-2 text-[13px] font-medium text-slate-700">Categoria serviciilor</p>
              <div className="grid grid-cols-3 gap-2">
                {VENDOR_CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-center text-xs font-medium transition",
                      category === c ? "bg-white text-ink ring-2 ring-brand-600" : "bg-white text-slate-600 ring-1 ring-sand-200 hover:ring-sand-300",
                    )}
                  >
                    <CategoryMark category={c} size="sm" />
                    {CATEGORY_META[c].label}
                  </button>
                ))}
              </div>
            </div>
            <Field label="Numele afacerii">
              <Input name="businessName" required placeholder="Ex: DJ Alex Beat" />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Oraș">
                <Input name="city" required placeholder="Cluj-Napoca" />
              </Field>
              <Field label="Preț de bază (€)">
                <Input name="basePrice" type="number" min={0} step={50} required defaultValue={1000} />
              </Field>
            </div>
          </div>
        )}

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Creează contul
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Ai deja cont?{" "}
        <Link href="/login" className="font-medium text-ink underline decoration-sand-300 underline-offset-4 hover:decoration-ink">
          Autentifică-te
        </Link>
      </p>
    </div>
  );
}
