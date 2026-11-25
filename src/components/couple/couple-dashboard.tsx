"use client";
// Persoana 2 — 2.1 Dashboard Miri & Tracker de Buget
// buget maxim - (preturi furnizori rezervati, scazute automat + cheltuieli extra), bare de progres, alerte
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle,
  Building2,
  CalendarHeart,
  Info,
  Pencil,
  PiggyBank,
  Plus,
  Receipt,
  Settings2,
  Trash2,
  Users,
  Wallet,
} from "lucide-react";
import { Button, Card, CardHeader, Field, Input, Modal, Progress, Select, StatCard } from "@/components/ui";
import { BudgetBreakdown } from "@/components/couple/budget-breakdown";
import { CATEGORY_META, EXPENSE_CATEGORIES, type VendorCategory } from "@/lib/constants";
import type { BudgetSummary } from "@/lib/services/budget";
import { api } from "@/lib/fetcher";
import { cn, daysUntil, formatDate, formatMoney } from "@/lib/utils";
import { CategoryMark } from "@/components/icons";

type Wedding = {
  coupleNames: string;
  weddingDate: string;
  totalBudget: number;
  expectedGuests: number;
  venueName: string | null;
  phone: string | null;
};

export function CoupleDashboard({
  wedding,
  budget,
  stats,
}: {
  wedding: Wedding;
  budget: BudgetSummary;
  stats: { guestTotal: number; guestConfirmed: number; guestSeated: number; tables: number };
}) {
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState(wedding);
  const [editBudget, setEditBudget] = useState(false);
  const [budgetValue, setBudgetValue] = useState(budget.totalBudget);
  const [expense, setExpense] = useState({ label: "", amount: "", category: "Altele" });
  const [saving, setSaving] = useState(false);

  const days = daysUntil(wedding.weddingDate);
  const seatedPct = stats.guestConfirmed ? (stats.guestSeated / stats.guestConfirmed) * 100 : 0;

  async function run(fn: () => Promise<unknown>, ok: string) {
    setSaving(true);
    try {
      await fn();
      toast.success(ok);
      router.refresh();
      return true;
    } catch (e) {
      toast.error((e as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)] ring-1 ring-sand-200/80 animate-fade-in">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(ellipse_at_top_right,#ffe3ea_0%,transparent_60%)] md:block" />
        <div className="bg-dots absolute inset-y-0 right-0 hidden w-1/3 opacity-60 [mask-image:linear-gradient(to_left,black,transparent)] md:block" />
        <div className="relative flex flex-col gap-6 p-6 sm:p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[13px] font-medium text-brand-600">Nunta voastră</p>
            <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight text-ink sm:text-[44px]">{wedding.coupleNames}</h1>
            <div className="mt-4 flex flex-wrap gap-2 text-[13px] text-slate-600">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-sand-50 px-2.5 py-1 ring-1 ring-inset ring-sand-200"><CalendarHeart className="size-3.5 text-slate-400" /> {formatDate(wedding.weddingDate, { weekday: "long" })}</span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-sand-50 px-2.5 py-1 ring-1 ring-inset ring-sand-200"><Building2 className="size-3.5 text-slate-400" /> {wedding.venueName ?? "Sala nu este încă rezervată"}</span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-sand-50 px-2.5 py-1 ring-1 ring-inset ring-sand-200"><Users className="size-3.5 text-slate-400" /> {wedding.expectedGuests} invitați estimați</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-baseline gap-2 rounded-xl bg-ink px-5 py-3.5 text-white shadow-[var(--shadow-lift)]">
              <span className="text-4xl font-semibold tracking-tight tabular-nums">{Math.abs(days)}</span>
              <span className="text-xs leading-tight text-white/70">{days >= 0 ? <>zile până<br />la nuntă</> : <>zile de la<br />nuntă</>}</span>
            </div>
            <Button variant="secondary" onClick={() => { setSettings(wedding); setSettingsOpen(true); }}>
              <Settings2 className="size-4" /> Setări
            </Button>
          </div>
        </div>
      </div>

      {/* ALERTE */}
      {budget.alerts.length > 0 && (
        <div className="space-y-2">
          {budget.alerts.map((a, i) => (
            <div
              key={i}
              className={cn(
                "flex items-start gap-3 rounded-xl bg-white px-4 py-3 text-sm shadow-[var(--shadow-xs)] ring-1 ring-sand-200 animate-fade-in",
                "border-l-[3px]",
                a.level === "danger" && "border-l-rose-500 text-rose-900 [&_svg]:text-rose-500",
                a.level === "warning" && "border-l-amber-500 text-amber-900 [&_svg]:text-amber-500",
                a.level === "info" && "border-l-sky-500 text-slate-700 [&_svg]:text-sky-500",
              )}
            >
              {a.level === "info" ? <Info className="mt-0.5 size-4 shrink-0" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0" />}
              <span>
                <strong className="font-semibold">{a.level === "danger" ? "Depășire buget: " : a.level === "warning" ? "Atenție: " : "De făcut: "}</strong>
                {a.message}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* KPI */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Buget total" value={formatMoney(budget.totalBudget)} icon={<Wallet className="size-4" />} />
        <StatCard
          label="Cheltuit"
          value={formatMoney(budget.spent)}
          hint={`${formatMoney(budget.vendorsSpent)} furnizori · ${formatMoney(budget.extrasSpent)} extra`}
          icon={<Receipt className="size-4" />}
          accent="bg-violet-50 text-violet-600 ring-violet-100"
        />
        <StatCard
          label="Rămas"
          value={<span className={budget.remaining < 0 ? "text-rose-600" : "text-emerald-600"}>{formatMoney(budget.remaining)}</span>}
          hint={budget.pendingTotal > 0 ? `${formatMoney(budget.pendingTotal)} în cereri neconfirmate` : "Nicio cerere în așteptare"}
          icon={<PiggyBank className="size-4" />}
          accent="bg-emerald-50 text-emerald-600 ring-emerald-100"
        />
        <StatCard
          label="Invitați așezați"
          value={`${stats.guestSeated} / ${stats.guestConfirmed}`}
          hint={`${stats.guestTotal} pe listă · ${stats.tables} mese`}
          icon={<Users className="size-4" />}
          accent="bg-sky-50 text-sky-600 ring-sky-100"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        {/* TRACKER BUGET */}
        <Card>
          <CardHeader
            title="Tracker de buget"
            description="Prețurile furnizorilor confirmați se scad automat din buget."
            icon={<PiggyBank className="size-4" />}
            action={
              editBudget ? (
                <div className="flex items-center gap-2">
                  <Input type="number" min={0} step={500} className="w-32" value={budgetValue} onChange={(e) => setBudgetValue(Number(e.target.value))} />
                  <Button
                    size="sm"
                    loading={saving}
                    onClick={async () => {
                      if (await run(() => api("/api/wedding/budget", { method: "PATCH", json: { totalBudget: budgetValue } }), "Buget actualizat")) setEditBudget(false);
                    }}
                  >
                    Salvează
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => { setBudgetValue(budget.totalBudget); setEditBudget(true); }}>
                  <Pencil className="size-3.5" /> Buget maxim
                </Button>
              )
            }
          />
          <div className="space-y-6 p-5">
            <div>
              <div className="mb-2 flex items-end justify-between">
                <p className="text-sm text-slate-500">Consumat</p>
                <p className={cn("text-sm font-semibold", budget.percent > 100 ? "text-rose-600" : "text-ink")}>
                  {budget.percent.toFixed(1)}%
                </p>
              </div>
              <Progress value={budget.percent} className="h-3.5" />
              {budget.pendingTotal > 0 && (
                <p className="mt-2 text-xs text-slate-500">
                  Cu cererile în așteptare ai ajunge la{" "}
                  <strong>{(((budget.spent + budget.pendingTotal) / Math.max(budget.totalBudget, 1)) * 100).toFixed(0)}%</strong>.
                </p>
              )}
            </div>

            <BudgetBreakdown categories={budget.byCategory} total={budget.totalBudget} />

            <div>
              <p className="mb-2 text-sm font-medium">Furnizori confirmați</p>
              {budget.confirmedBookings.length === 0 ? (
                <p className="rounded-xl bg-sand-50 p-4 text-sm text-slate-500">
                  Niciun furnizor confirmat. <Link className="font-medium text-brand-600 hover:underline" href="/marketplace">Caută în marketplace →</Link>
                </p>
              ) : (
                <div className="divide-y divide-sand-100 rounded-xl ring-1 ring-sand-200/80">
                  {budget.confirmedBookings.map((b) => (
                    <div key={b.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                      <span className="flex items-center gap-2.5">
                        <CategoryMark category={b.category} size="sm" /> {b.vendorName}
                        <span className="text-xs text-slate-400">{CATEGORY_META[b.category as VendorCategory]?.label}</span>
                      </span>
                      <span className="font-medium tabular-nums">− {formatMoney(b.amount)}</span>
                    </div>
                  ))}
                  {budget.pendingBookings.map((b) => (
                    <div key={b.id} className="flex items-center justify-between px-4 py-2.5 text-sm text-slate-400">
                      <span className="flex items-center gap-2.5">
                        <CategoryMark category={b.category} size="sm" className="opacity-60" /> {b.vendorName}
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">în așteptare</span>
                      </span>
                      <span className="tabular-nums">({formatMoney(b.amount)})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* CHELTUIELI EXTRA */}
        <div className="space-y-6">
          <Card>
            <CardHeader title="Cheltuieli extra" description="Rochie, verighete, invitații..." icon={<Receipt className="size-4" />} />
            <form
              className="grid gap-2 border-b border-sand-100 p-4 sm:grid-cols-[1fr_110px]"
              onSubmit={async (e) => {
                e.preventDefault();
                const ok = await run(
                  () => api("/api/wedding/expenses", { method: "POST", json: { ...expense, amount: Number(expense.amount) } }),
                  "Cheltuială adăugată",
                );
                if (ok) setExpense({ label: "", amount: "", category: expense.category });
              }}
            >
              <Input required minLength={2} placeholder="Descriere" value={expense.label} onChange={(e) => setExpense({ ...expense, label: e.target.value })} />
              <Input required type="number" min={0} placeholder="Sumă €" value={expense.amount} onChange={(e) => setExpense({ ...expense, amount: e.target.value })} />
              <Select value={expense.category} onChange={(e) => setExpense({ ...expense, category: e.target.value })}>
                {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </Select>
              <Button type="submit" loading={saving}><Plus className="size-4" /> Adaugă</Button>
            </form>
            <div className="thin-scroll max-h-80 divide-y divide-sand-100 overflow-y-auto">
              {budget.expenses.length === 0 && <p className="p-5 text-sm text-slate-500">Nicio cheltuială extra.</p>}
              {budget.expenses.map((e) => (
                <div key={e.id} className="group flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium">{e.label}</p>
                    <p className="text-xs text-slate-400">{e.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium tabular-nums">{formatMoney(e.amount)}</span>
                    <button
                      className="rounded-lg p-1.5 text-slate-300 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
                      onClick={() => run(() => api(`/api/wedding/expenses/${e.id}`, { method: "DELETE" }), "Cheltuială ștearsă")}
                      aria-label="Șterge"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <p className="font-semibold">Progres invitați la mese</p>
            <p className="mt-1 text-sm text-slate-500">{stats.guestSeated} din {stats.guestConfirmed} invitați confirmați au loc la masă.</p>
            <Progress value={seatedPct} className="mt-3" />
            <div className="mt-4 flex gap-2">
              <Link href="/couple/guests" className="flex-1 rounded-xl bg-sand-50 py-2 text-center text-sm font-medium ring-1 ring-sand-200/80 hover:bg-brand-50">Invitați</Link>
              <Link href="/couple/floorplan" className="flex-1 rounded-xl bg-ink py-2 text-center text-sm font-medium text-white hover:bg-ink/90">Plan 2D sală</Link>
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Setările nunții"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSettingsOpen(false)}>Renunță</Button>
            <Button
              loading={saving}
              onClick={async () => {
                const ok = await run(
                  () =>
                    api("/api/wedding", {
                      method: "PATCH",
                      json: {
                        coupleNames: settings.coupleNames,
                        weddingDate: settings.weddingDate,
                        totalBudget: settings.totalBudget,
                        expectedGuests: settings.expectedGuests,
                        phone: settings.phone,
                      },
                    }),
                  "Setări salvate",
                );
                if (ok) setSettingsOpen(false);
              }}
            >
              Salvează
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Numele mirilor" className="sm:col-span-2">
            <Input value={settings.coupleNames} onChange={(e) => setSettings({ ...settings, coupleNames: e.target.value })} />
          </Field>
          <Field label="Data nunții" hint="Se poate schimba doar fără rezervări active">
            <Input type="date" value={settings.weddingDate} onChange={(e) => setSettings({ ...settings, weddingDate: e.target.value })} />
          </Field>
          <Field label="Telefon contact">
            <Input value={settings.phone ?? ""} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} />
          </Field>
          <Field label="Buget maxim (€)">
            <Input type="number" min={0} value={settings.totalBudget} onChange={(e) => setSettings({ ...settings, totalBudget: Number(e.target.value) })} />
          </Field>
          <Field label="Nr. estimat invitați">
            <Input type="number" min={1} value={settings.expectedGuests} onChange={(e) => setSettings({ ...settings, expectedGuests: Number(e.target.value) })} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
