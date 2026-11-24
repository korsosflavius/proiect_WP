// Persoana 1 — layout pentru paginile de autentificare (formular + panou de prezentare)
import { AlertTriangle, Check, Leaf, Quote } from "lucide-react";
import { Logo } from "@/components/app-shell";
import { CategoryMark } from "@/components/icons";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col px-6 py-6 sm:px-12 lg:px-16">
        <Logo />
        <div className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-[400px] animate-fade-in">{children}</div>
        </div>
        <p className="text-xs text-slate-400">© {new Date().getFullYear()} WedCraft · Proiect Web Programming</p>
      </div>

      <div className="relative hidden overflow-hidden bg-ink p-3 lg:block">
        <div className="relative flex h-full flex-col overflow-hidden rounded-[22px] bg-[#221b2e]">
          <div className="absolute -right-24 -top-24 size-[420px] rounded-full bg-brand-600/35 blur-[110px]" />
          <div className="absolute -bottom-32 -left-16 size-[380px] rounded-full bg-violet-600/25 blur-[110px]" />
          <div className="bg-dots absolute inset-0 opacity-[0.12] [filter:invert(1)]" />

          {/* compozitie de carduri din aplicatie */}
          <div className="relative flex flex-1 items-center justify-center p-12">
            <div className="relative w-full max-w-[420px]">
              <div className="rounded-2xl bg-white p-5 shadow-2xl">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Rezervările voastre</p>
                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                    4 / 6 confirmate
                  </span>
                </div>
                <div className="mt-4 space-y-2.5">
                  {[
                    ["VENUE", "Palatul Florilor", "13.500 €", true],
                    ["DJ", "DJ Alex Beat", "1.800 €", true],
                    ["PASTRY", "Cofetăria Dulce Vis", "900 €", true],
                    ["PHOTOGRAPHER", "Studio Lumière", "2.600 €", false],
                  ].map(([cat, name, price, ok]) => (
                    <div key={name as string} className="flex items-center gap-3 rounded-xl p-2 ring-1 ring-sand-200">
                      <CategoryMark category={cat as string} size="sm" />
                      <p className="flex-1 truncate text-sm font-medium text-ink">{name as string}</p>
                      <p className="text-sm tabular-nums text-slate-500">{price as string}</p>
                      {ok ? (
                        <span className="grid size-5 place-items-center rounded-full bg-emerald-600 text-white">
                          <Check className="size-3" strokeWidth={3} />
                        </span>
                      ) : (
                        <span className="size-5 rounded-full border-2 border-dashed border-amber-400" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute -bottom-10 -left-10 w-[220px] rounded-xl bg-white p-3.5 shadow-2xl">
                <p className="text-[11px] font-medium text-slate-500">Buget rămas</p>
                <p className="mt-0.5 text-xl font-semibold tracking-tight text-ink">7.880 €</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand-100">
                  <div className="h-full w-[68%] rounded-full bg-brand-600" />
                </div>
              </div>

              <div className="absolute -right-8 -top-8 rounded-xl bg-white px-3 py-2.5 shadow-2xl">
                <p className="text-xs font-semibold text-ink">Ana Dumitru · Masa 2</p>
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
                  <Leaf className="size-3 text-green-600" /> Vegan · <AlertTriangle className="size-3 text-rose-500" /> Gluten
                </p>
              </div>
            </div>
          </div>

          <div className="relative p-12 pt-0 text-white">
            <Quote className="size-7 text-brand-400" />
            <p className="mt-3 max-w-md font-display text-[26px] leading-snug">
              Cea mai frumoasă zi merită cea mai bună organizare.
            </p>
            <p className="mt-3 max-w-md text-sm text-white/60">
              Miri și furnizori pe aceeași platformă — rezervări, calendar, buget, invitați și planul sălii.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
