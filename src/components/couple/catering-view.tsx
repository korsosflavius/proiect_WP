"use client";
// Persoana 2 — 2.4 Centralizator catering: statistici automate pe meniuri/alergii + liste pe mese + export
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Armchair, FileDown, FileSpreadsheet, Users, UtensilsCrossed } from "lucide-react";
import { Badge, Button, Card, CardHeader, PageHeader, StatCard } from "@/components/ui";
import { MENU_META, MENU_TYPES, type MenuType } from "@/lib/constants";
import type { CateringSummary } from "@/lib/services/guests";
import { exportCSV, exportPDF } from "@/lib/export";
import { MenuIcon, MenuMark } from "@/components/icons";

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

/** Bare orizontale: lungimea = numarul de portii; eticheta si valoarea sunt mereu vizibile */
function Bars({
  items,
  max,
}: {
  items: { key: string; label: React.ReactNode; value: number; color: string }[];
  max: number;
}) {
  const [hover, setHover] = useState<string | null>(null);
  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li
          key={it.key}
          onMouseEnter={() => setHover(it.key)}
          onMouseLeave={() => setHover(null)}
          className="grid grid-cols-[140px_1fr_44px] items-center gap-3 text-sm"
          title={`${it.key}: ${it.value}`}
        >
          <span className="truncate text-slate-600">{it.label}</span>
          <span className="h-6 rounded-[4px] bg-sand-50">
            <span
              className="block h-full rounded-r-[4px] transition-all duration-700"
              style={{
                width: `${max ? Math.max((it.value / max) * 100, it.value ? 2 : 0) : 0}%`,
                background: it.color,
                opacity: hover && hover !== it.key ? 0.4 : 1,
              }}
            />
          </span>
          <span className="text-right font-semibold tabular-nums text-ink">{it.value}</span>
        </li>
      ))}
    </ul>
  );
}

export function CateringView({ summary }: { summary: CateringSummary }) {
  const [busy, setBusy] = useState<"pdf" | "csv" | null>(null);
  const t = summary.totals;
  const maxMenu = Math.max(...MENU_TYPES.map((m) => summary.menus[m] ?? 0), 1);
  const allergyEntries = Object.entries(summary.allergyCounts).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  const maxAllergy = Math.max(...allergyEntries.map(([, n]) => n), 1);

  // propozitia "rezumat" ceruta: ex. "85 Standard, 12 Vegetarieni, 3 alergici la nuci"
  const sentence = [
    ...MENU_TYPES.filter((m) => summary.menus[m] > 0).map((m) => `${summary.menus[m]} ${MENU_META[m].label}`),
    ...allergyEntries.map(([a, n]) => `${plural(n, "alergic", "alergici")} la ${a.toLowerCase()}`),
  ].join(", ");

  async function run(kind: "pdf" | "csv") {
    setBusy(kind);
    try {
      if (kind === "pdf") await exportPDF(summary);
      else exportCSV(summary);
      toast.success(`Export ${kind.toUpperCase()} generat`);
    } catch (e) {
      console.error(e);
      toast.error("Exportul a eșuat");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Centralizator catering"
        crumbs={[{ label: "Planificare", href: "/couple/dashboard" }, { label: "Catering & export" }]}
        description="Statistici automate pentru bucătărie și sala de evenimente (fără invitații care au refuzat)."
        actions={
          <>
            <Button variant="secondary" loading={busy === "csv"} onClick={() => run("csv")}>
              <FileSpreadsheet className="size-4" /> Export CSV
            </Button>
            <Button loading={busy === "pdf"} onClick={() => run("pdf")}>
              <FileDown className="size-4" /> Export PDF
            </Button>
          </>
        }
      />

      <Card className="flex items-start gap-3 p-5">
        <div className="rounded-xl bg-brand-50 p-2.5 text-brand-600"><UtensilsCrossed className="size-5" /></div>
        <div>
          <p className="text-sm text-slate-500">Rezumat pentru catering</p>
          <p className="mt-0.5 text-lg font-medium text-ink">{sentence || "Nu există încă invitați."}</p>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Porții totale" value={t.attending} hint={`${t.confirmed} confirmați · ${t.pending} neconfirmați`} icon={<Users className="size-4" />} />
        <StatCard label="Așezați la mese" value={`${t.seated} / ${t.attending}`} icon={<Armchair className="size-4" />} accent="bg-sky-50 text-sky-600 ring-sky-100" />
        <StatCard label="Cu alergii" value={t.withAllergies} icon={<AlertTriangle className="size-4" />} accent="bg-rose-50 text-rose-600 ring-rose-100" />
        <StatCard label="Au refuzat" value={t.declined} hint="Excluși din calcule" icon={<Users className="size-4" />} accent="bg-sand-100 text-slate-500 ring-sand-200" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Porții pe tip de meniu" />
          <div className="p-5">
            <Bars
              max={maxMenu}
              items={MENU_TYPES.map((m) => ({
                key: m,
                label: <span className="inline-flex items-center gap-2"><MenuMark menu={m} /> {MENU_META[m].label}</span>,
                value: summary.menus[m] ?? 0,
                color: MENU_META[m].color,
              }))}
            />
          </div>
        </Card>
        <Card>
          <CardHeader title="Invitați cu alergii" description="Un invitat poate avea mai multe alergii" />
          <div className="p-5">
            {allergyEntries.length === 0 ? (
              <p className="text-sm text-slate-500">Niciun invitat cu alergii declarate.</p>
            ) : (
              <Bars max={maxAllergy} items={allergyEntries.map(([a, n]) => ({ key: a, label: <span className="inline-flex items-center gap-2"><AlertTriangle className="size-3.5 text-rose-500" /> {a}</span>, value: n, color: "#3b2a3f" }))} />
            )}
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Lista pe mese" description="Ce primește fiecare masă — pentru ospătari și bucătărie." />
        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
          {summary.byTable.map((table) => (
            <div key={table.id} className="rounded-2xl ring-1 ring-sand-200/80">
              <div className="flex items-center justify-between rounded-t-2xl bg-sand-50 px-4 py-2.5">
                <p className="font-semibold">{table.label}</p>
                <span className="text-xs text-slate-500">{table.guests.length} / {table.capacity} locuri</span>
              </div>
              <div className="flex flex-wrap gap-1.5 border-b border-sand-100 px-4 py-2">
                {MENU_TYPES.filter((m) => table.menus[m]).map((m) => (
                  <Badge key={m} className={MENU_META[m as MenuType].className}>
                    <MenuIcon menu={m} /> {table.menus[m]} {MENU_META[m as MenuType].label}
                  </Badge>
                ))}
                {table.guests.length === 0 && <span className="text-xs text-slate-400">Masă goală</span>}
              </div>
              <ul className="divide-y divide-sand-100 text-sm">
                {table.guests.map((g) => (
                  <li key={g.id} className="flex items-center justify-between gap-2 px-4 py-2">
                    <span>
                      <span className="mr-2 text-xs text-slate-400">#{(g.seatIndex ?? 0) + 1}</span>
                      {g.fullName}
                    </span>
                    <span className="flex gap-1">
                      <span title={MENU_META[g.menuType as MenuType]?.label} className="grid place-items-center"><MenuMark menu={g.menuType} /></span>
                      {g.allergies.length > 0 && (
                        <Badge className="bg-rose-50 text-rose-700"><AlertTriangle className="size-3" /> {g.allergies.join(", ")}</Badge>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {summary.unseated.length > 0 && (
            <div className="rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/40">
              <div className="px-4 py-2.5">
                <p className="font-semibold text-amber-800">Neașezați ({summary.unseated.length})</p>
              </div>
              <ul className="divide-y divide-amber-100 text-sm">
                {summary.unseated.map((g) => (
                  <li key={g.id} className="flex items-center justify-between px-4 py-2">
                    {g.fullName}
                    <span className="flex items-center gap-1.5"><MenuMark menu={g.menuType} />{g.allergies.length > 0 && <AlertTriangle className="size-3.5 text-rose-500" />}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
