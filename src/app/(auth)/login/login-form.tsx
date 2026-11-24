"use client";
// Persoana 1 — 1.1 Formular login (NextAuth Credentials) + conturi demo
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Heart, Lock, Mail } from "lucide-react";
import { CategoryMark } from "@/components/icons";
import { Button, Field, Input } from "@/components/ui";

const DEMO = [
  { label: "Andrei & Maria", role: "Miri", category: null, email: "andrei.maria@wedcraft.ro" },
  { label: "DJ Alex Beat", role: "Furnizor", category: "DJ", email: "dj@wedcraft.ro" },
  { label: "Palatul Florilor", role: "Furnizor", category: "VENUE", email: "sala@wedcraft.ro" },
];

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function login(e?: React.FormEvent, creds?: { email: string; password: string }) {
    e?.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", {
      email: creds?.email ?? email,
      password: creds?.password ?? password,
      redirect: false,
    });
    if (!res || res.error) {
      setLoading(false);
      toast.error("Email sau parolă greșită");
      return;
    }
    const session = await getSession();
    const home = session?.user.role === "VENDOR" ? "/vendor/dashboard" : "/couple/dashboard";
    toast.success(`Bine ai revenit, ${session?.user.name ?? ""}!`);
    router.push(callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : home);
    router.refresh();
  }

  return (
    <div>
      <h1 className="text-[28px] font-semibold tracking-tight">Bine ai revenit</h1>
      <p className="mt-1.5 text-[15px] text-slate-500">Autentifică-te pentru a continua planificarea.</p>

      <form onSubmit={login} className="mt-8 space-y-4">
        <Field label="Email">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="email"
              required
              autoComplete="email"
              className="pl-9"
              placeholder="nume@exemplu.ro"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </Field>
        <Field label="Parolă">
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="password"
              required
              autoComplete="current-password"
              className="pl-9"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Autentificare
        </Button>
      </form>

      <div className="my-8 flex items-center gap-3 text-xs text-slate-400">
        <span className="h-px flex-1 bg-sand-200" /> sau intră rapid cu un cont demo <span className="h-px flex-1 bg-sand-200" />
      </div>

      <div className="grid gap-2">
        {DEMO.map((d) => (
          <button
            key={d.email}
            type="button"
            disabled={loading}
            onClick={() => login(undefined, { email: d.email, password: "parola123" })}
            className="group flex items-center gap-3 rounded-xl bg-white px-3 py-2.5 text-left shadow-[var(--shadow-xs)] ring-1 ring-sand-200 transition hover:ring-sand-300 hover:shadow-[var(--shadow-card)] disabled:opacity-60"
          >
            {d.category ? (
              <CategoryMark category={d.category} size="sm" />
            ) : (
              <span className="grid size-7 place-items-center rounded-xl bg-brand-50 text-brand-600"><Heart className="size-3.5" /></span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-ink">{d.label}</span>
              <span className="block truncate text-xs text-slate-400">{d.role} · {d.email}</span>
            </span>
            <ArrowRight className="size-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-ink" />
          </button>
        ))}
        <p className="mt-1 text-center text-xs text-slate-400">Parola pentru toate conturile demo: <code className="rounded bg-sand-100 px-1 py-0.5">parola123</code></p>
      </div>

      <p className="mt-8 text-center text-sm text-slate-500">
        Nu ai cont?{" "}
        <Link href="/register" className="font-medium text-ink underline decoration-sand-300 underline-offset-4 hover:decoration-ink">
          Creează unul gratuit
        </Link>
      </p>
    </div>
  );
}
