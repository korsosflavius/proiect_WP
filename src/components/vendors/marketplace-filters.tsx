"use client";
// Persoana 1 — 1.3 bara de filtre Marketplace (categorie, pret maxim, data, cautare, oras, sortare)
// Filtrele sunt tinute in URL (?category=&maxPrice=&date=...) -> pagina server re-interogheaza DB.
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { CalendarCheck, Loader2, Search, SlidersHorizontal, X } from "lucide-react";
import { Chip, Input, Select } from "@/components/ui";
import { CATEGORY_META, VENDOR_CATEGORIES } from "@/lib/constants";
import { formatMoney } from "@/lib/utils";
import { CategoryIcon } from "@/components/icons";

export function MarketplaceFilters({ weddingDate }: { weddingDate?: string | null }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [q, setQ] = useState(params.get("q") ?? "");
  const [maxPrice, setMaxPrice] = useState(Number(params.get("maxPrice") ?? 15000));

  function update(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
  }

  // live search cu debounce
  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get("q") ?? "") !== q) update({ q: q || null });
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const category = params.get("category");
  const date = params.get("date") ?? "";
  const hasFilters = ["category", "maxPrice", "date", "q", "city"].some((k) => params.get(k));

  return (
    <div className="space-y-4 rounded-2xl bg-white/80 p-4 shadow-sm ring-1 ring-sand-200/80 backdrop-blur">
      <div className="flex flex-wrap gap-2">
        <Chip active={!category} onClick={() => update({ category: null })}>
          Toate
        </Chip>
        {VENDOR_CATEGORIES.map((c) => (
          <Chip key={c} active={category === c} onClick={() => update({ category: category === c ? null : c })}>
            <CategoryIcon category={c} className="size-3.5" /> {CATEGORY_META[c].label}
          </Chip>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-[1.5fr_1fr_1fr_1.2fr_auto] md:items-end">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">Caută</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="Nume sau descriere..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">Oraș</span>
          <Input
            placeholder="Orice oraș"
            defaultValue={params.get("city") ?? ""}
            onBlur={(e) => update({ city: e.target.value || null })}
            onKeyDown={(e) => e.key === "Enter" && update({ city: (e.target as HTMLInputElement).value || null })}
          />
        </label>

        <label className="block">
          <span className="mb-1 flex justify-between text-xs font-medium text-slate-500">
            Preț maxim <span className="text-brand-600">{formatMoney(maxPrice)}</span>
          </span>
          <input
            type="range"
            min={500}
            max={15000}
            step={250}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            onPointerUp={() => update({ maxPrice: maxPrice >= 15000 ? null : String(maxPrice) })}
            onKeyUp={() => update({ maxPrice: maxPrice >= 15000 ? null : String(maxPrice) })}
            className="h-10 w-full accent-brand-600"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500">Disponibil pe data</span>
          <div className="flex gap-2">
            <Input type="date" value={date} onChange={(e) => update({ date: e.target.value || null })} />
            {weddingDate && date !== weddingDate && (
              <button
                type="button"
                title="Data nunții mele"
                onClick={() => update({ date: weddingDate })}
                className="shrink-0 rounded-xl bg-brand-50 px-3 text-brand-600 ring-1 ring-brand-100 hover:bg-brand-100"
              >
                <CalendarCheck className="size-4" />
              </button>
            )}
          </div>
        </label>

        <div className="flex items-center gap-2">
          <Select
            value={params.get("sort") ?? "price_asc"}
            onChange={(e) => update({ sort: e.target.value === "price_asc" ? null : e.target.value })}
          >
            <option value="price_asc">Preț crescător</option>
            <option value="price_desc">Preț descrescător</option>
            <option value="name">Nume A–Z</option>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : <SlidersHorizontal className="size-3.5" />}
          {pending ? "Se actualizează..." : "Filtrele se aplică instant"}
        </span>
        {hasFilters && (
          <button
            onClick={() => {
              setQ("");
              setMaxPrice(15000);
              startTransition(() => router.replace(pathname, { scroll: false }));
            }}
            className="inline-flex items-center gap-1 font-medium text-brand-600 hover:underline"
          >
            <X className="size-3.5" /> Resetează filtrele
          </button>
        )}
      </div>
    </div>
  );
}
