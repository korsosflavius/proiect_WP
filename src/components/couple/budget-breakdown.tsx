"use client";
// Persoana 2 — 2.1 defalcarea bugetului: bara segmentata (parte-din-intreg) + legenda cu valori
// Culori pe categorie din paleta validata (ordine fixa); fiecare segment are tooltip la hover,
// iar legenda de dedesubt afiseaza explicit numele + suma (identitatea nu depinde doar de culoare).
import { useState } from "react";
import { formatMoney } from "@/lib/utils";
import { CategoryIcon } from "@/components/icons";

type Cat = { key: string; label: string; color: string; amount: number };

export function BudgetBreakdown({ categories, total }: { categories: Cat[]; total: number }) {
  const [hover, setHover] = useState<string | null>(null);
  const spent = categories.reduce((s, c) => s + c.amount, 0);
  const scale = Math.max(total, spent, 1);
  const free = Math.max(total - spent, 0);
  if (categories.length === 0) return null;

  const active = categories.find((c) => c.key === hover);

  return (
    <div>
      <div className="mb-2 flex items-end justify-between">
        <p className="text-sm font-medium">Unde merg banii</p>
        <p className="h-5 text-xs text-slate-500">
          {active ? (
            <>
              <span className="font-semibold text-ink">{active.label}</span> · {formatMoney(active.amount)} ·{" "}
              {((active.amount / scale) * 100).toFixed(1)}% din buget
            </>
          ) : (
            "Treci cu mouse-ul peste segmente"
          )}
        </p>
      </div>
      <div className="flex h-7 w-full gap-[2px] overflow-hidden rounded-[4px] bg-white" role="img" aria-label="Defalcarea bugetului pe categorii">
        {categories.map((c) => (
          <div
            key={c.key}
            onMouseEnter={() => setHover(c.key)}
            onMouseLeave={() => setHover(null)}
            className="h-full cursor-default transition-opacity first:rounded-l-[4px]"
            style={{
              width: `${(c.amount / scale) * 100}%`,
              background: c.color,
              opacity: hover && hover !== c.key ? 0.35 : 1,
            }}
            title={`${c.label}: ${formatMoney(c.amount)}`}
          />
        ))}
        {free > 0 && <div className="h-full rounded-r-[4px] bg-sand-100" style={{ width: `${(free / scale) * 100}%` }} title={`Disponibil: ${formatMoney(free)}`} />}
      </div>
      <ul className="mt-3 grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
        {categories.map((c) => (
          <li
            key={c.key}
            onMouseEnter={() => setHover(c.key)}
            onMouseLeave={() => setHover(null)}
            className="flex items-center justify-between gap-2 rounded-lg px-1.5 py-0.5 hover:bg-sand-50"
          >
            <span className="flex items-center gap-2 text-slate-600">
              <span className="size-2.5 shrink-0 rounded-full" style={{ background: c.color }} />
              <CategoryIcon category={c.key} className="size-3.5 text-slate-400" /> {c.label}
            </span>
            <span className="font-medium tabular-nums text-ink">{formatMoney(c.amount)}</span>
          </li>
        ))}
        {free > 0 && (
          <li className="flex items-center justify-between gap-2 px-1.5 py-0.5">
            <span className="flex items-center gap-2 text-slate-500">
              <span className="size-2.5 rounded-full bg-slate-200" /> Disponibil
            </span>
            <span className="font-medium tabular-nums text-slate-500">{formatMoney(free)}</span>
          </li>
        )}
      </ul>
    </div>
  );
}
