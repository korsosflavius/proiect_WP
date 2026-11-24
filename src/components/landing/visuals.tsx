// Comun — ilustratii pentru landing, construite din elementele aplicatiei (fara fotografii)
import { AlertTriangle, Check, GripVertical, Leaf, MousePointer2, TrendingDown } from "lucide-react";
import { CategoryMark } from "@/components/icons";

const MENU = { s: "#2a78d6", v: "#eb6834", g: "#1baf7a", k: "#eda100" };
type Seat = keyof typeof MENU | null;

/** Masa rotunda SVG cu scaune distribuite uniform (fara suprapuneri) */
function RoundTable({
  cx,
  cy,
  label,
  seats,
  r = 30,
}: {
  cx: number;
  cy: number;
  label: string;
  seats: Seat[];
  r?: number;
}) {
  const d = r + 15;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="#fff" stroke="#e5dbe0" strokeWidth={1.5} filter="url(#soft)" />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize={10} fontWeight={600} fill="#1a1523">
        {label}
      </text>
      {seats.map((s, i) => {
        const a = (i / seats.length) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(a) * d;
        const y = cy + Math.sin(a) * d;
        return (
          <circle key={i} cx={x} cy={y} r={7.5} fill={s ? MENU[s] : "#eef0f3"} stroke="#fff" strokeWidth={2} />
        );
      })}
    </g>
  );
}

/** Ilustratia principala din hero: fereastra aplicatiei cu planul salii + carduri plutitoare */
export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[600px]">
      {/* fereastra aplicatiei */}
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-float)] ring-1 ring-sand-200">
        <div className="flex items-center gap-2 border-b border-sand-100 bg-sand-50 px-4 py-2.5">
          <span className="size-2.5 rounded-full bg-[#ff5f57]" />
          <span className="size-2.5 rounded-full bg-[#febc2e]" />
          <span className="size-2.5 rounded-full bg-[#28c840]" />
          <span className="ml-3 rounded-md bg-white px-3 py-0.5 text-[11px] text-slate-400 ring-1 ring-sand-200">
            wedcraft.app/couple/floorplan
          </span>
        </div>
        <div className="flex">
          {/* lista invitati */}
          <div className="hidden w-[150px] shrink-0 space-y-1.5 border-r border-sand-100 bg-white p-3 sm:block">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Neașezați · 4</p>
            {[
              ["AN", "Ana Dumitru", MENU.g, true],
              ["BT", "Bianca Toma", MENU.g, false],
              ["IP", "Ioana Pavel", MENU.s, true],
              ["DR", "Darius Rus", MENU.s, false],
            ].map(([ini, name, color, allergy], i) => (
              <div
                key={i}
                className={`flex items-center gap-2 rounded-lg p-1.5 ring-1 ${i === 1 ? "opacity-40 ring-dashed ring-brand-300" : "ring-sand-200"}`}
              >
                <span className="relative grid size-6 shrink-0 place-items-center rounded-full text-[8px] font-bold text-white" style={{ background: color as string }}>
                  {ini as string}
                  {allergy && <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-rose-600 ring-1 ring-white" />}
                </span>
                <span className="truncate text-[10px] font-medium text-ink">{name as string}</span>
              </div>
            ))}
          </div>
          {/* plan sala */}
          <div className="bg-dots relative flex-1 bg-[#f7f3f5] p-3">
            <svg viewBox="0 0 400 290" className="h-auto w-full">
              <defs>
                <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#1a1523" floodOpacity="0.08" />
                </filter>
              </defs>
              <rect x="4" y="4" width="392" height="282" rx="14" fill="#fff" stroke="#ece7e4" strokeWidth={1.5} />
              {/* prezidiu */}
              <rect x="135" y="30" width="130" height="30" rx="8" fill="#fff1f4" stroke="#fb6890" strokeWidth={1.5} filter="url(#soft)" />
              <text x="200" y="46" textAnchor="middle" dominantBaseline="middle" fontSize={10} fontWeight={600} fill="#b9124a">Prezidiu</text>
              {[MENU.s, MENU.v, MENU.s, MENU.g, MENU.s].map((color, i) => (
                <circle key={i} cx={155 + i * 22.5} cy={18} r={7} fill={color} stroke="#fff" strokeWidth={2} />
              ))}
              {/* ring dans */}
              <rect x="150" y="105" width="100" height="70" rx="12" fill="#f5f3ff" stroke="#c4b5fd" strokeDasharray="6 5" strokeWidth={1.5} />
              <text x="200" y="141" textAnchor="middle" dominantBaseline="middle" fontSize={10} fontWeight={600} fill="#7c3aed">Ring de dans</text>
              <RoundTable cx={75} cy={120} label="Masa 1" seats={["s", "v", "s", "k", "s", "g", "s", "s"]} />
              <RoundTable cx={325} cy={120} label="Masa 2" seats={["s", "s", "g", "s", "v", null, null, "s"]} />
              <RoundTable cx={95} cy={225} label="Masa 3" seats={["s", "k", "k", "s", null, "s", null, "s"]} />
              <RoundTable cx={305} cy={225} label="Masa 4" seats={["v", "s", "s", null, null, null, "s", "g"]} />
              {/* tinta de drop evidentiata */}
              <circle cx={305 + Math.cos((4 / 8) * Math.PI * 2 - Math.PI / 2) * 45} cy={225 + Math.sin((4 / 8) * Math.PI * 2 - Math.PI / 2) * 45} r={11} fill="#ffe3ea" stroke="#dc1d58" strokeWidth={2} />
            </svg>
            {/* invitatul tras */}
            <div className="absolute bottom-[3%] right-[22%] flex items-center gap-1 sm:bottom-[4%] sm:right-[24%]">
              <span className="grid size-7 place-items-center rounded-full text-[9px] font-bold text-white shadow-lg ring-2 ring-white" style={{ background: MENU.g }}>
                BT
              </span>
              <MousePointer2 className="size-4 -translate-x-1 translate-y-2 fill-ink text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* card buget plutitor */}
      <div className="absolute -left-4 top-[58%] hidden w-[210px] rounded-xl bg-white p-3.5 shadow-[var(--shadow-lift)] ring-1 ring-sand-200 animate-fade-in sm:block lg:-left-12" style={{ animationDelay: "0.25s" }}>
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium text-slate-500">Buget consumat</p>
          <TrendingDown className="size-3.5 text-emerald-600" />
        </div>
        <p className="mt-1 text-lg font-semibold tracking-tight text-ink">17.120 € <span className="text-xs font-normal text-slate-400">/ 25.000 €</span></p>
        <div className="mt-2 flex h-1.5 gap-[2px] overflow-hidden rounded-full bg-sand-100">
          <span className="h-full w-[54%] bg-[#2a78d6]" />
          <span className="h-full w-[7%] bg-[#eb6834]" />
          <span className="h-full w-[4%] bg-[#eda100]" />
          <span className="h-full w-[15%] bg-[#6250d6]" />
        </div>
      </div>

      {/* card rezervare confirmata */}
      <div className="absolute -right-3 -top-5 hidden w-[230px] rounded-xl bg-white p-3 shadow-[var(--shadow-lift)] ring-1 ring-sand-200 animate-fade-in sm:block lg:-right-8" style={{ animationDelay: "0.45s" }}>
        <div className="flex items-center gap-2.5">
          <CategoryMark category="DJ" size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-ink">DJ Alex Beat</p>
            <p className="text-[11px] text-slate-500">12 iunie 2027 · 1.800 €</p>
          </div>
          <span className="grid size-5 place-items-center rounded-full bg-emerald-600 text-white">
            <Check className="size-3" strokeWidth={3} />
          </span>
        </div>
      </div>

      {/* card tooltip invitat */}
      <div className="absolute -bottom-6 right-6 hidden rounded-xl bg-ink px-3 py-2 text-white shadow-[var(--shadow-lift)] animate-fade-in md:block" style={{ animationDelay: "0.65s" }}>
        <p className="text-xs font-semibold">Ana Dumitru</p>
        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-white/70">
          <Leaf className="size-3 text-green-400" /> Vegan · <AlertTriangle className="size-3 text-rose-400" /> Gluten, Nuci
        </p>
      </div>
    </div>
  );
}

/** Mini-calendar pentru sectiunea "Pentru furnizori" */
export function CalendarVisual() {
  // iunie 2027 incepe marti -> 1 spatiu gol (saptamana incepe luni)
  const booked = new Set([12, 26]);
  const pending = new Set([20]);
  const blocked = new Set([5, 19]);
  const cells = [null, ...Array.from({ length: 30 }, (_, i) => i + 1)];
  return (
    <div className="relative mx-auto w-full max-w-[520px]">
      <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-float)] ring-1 ring-sand-200">
        <div className="mb-4 flex items-center justify-between">
          <p className="font-display text-xl font-semibold">Iunie 2027</p>
          <div className="flex gap-1.5 text-[11px]">
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">Liber</span>
            <span className="rounded-md bg-rose-50 px-2 py-0.5 font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20">Nuntă</span>
            <span className="rounded-md bg-sand-50 px-2 py-0.5 font-medium text-slate-600 ring-1 ring-inset ring-sand-200">Blocat</span>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {["Lu", "Ma", "Mi", "Jo", "Vi", "Sâ", "Du"].map((d) => (
            <span key={d} className="pb-1.5">{d}</span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((n, i) => {
            if (n === null) return <span key={i} />;
            const cls = booked.has(n)
              ? "bg-rose-600 text-white font-semibold shadow-sm"
              : pending.has(n)
                ? "bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-300"
                : blocked.has(n)
                  ? "text-slate-400 [background:repeating-linear-gradient(45deg,#f8fafc_0_4px,#e2e8f0_4px_6px)]"
                  : "bg-emerald-50/60 text-emerald-800";
            return (
              <span key={i} className={`grid aspect-square place-items-center rounded-lg text-xs ${cls}`}>
                {n}
              </span>
            );
          })}
        </div>
      </div>
      <div className="absolute -bottom-8 -right-2 w-[260px] rounded-xl bg-white p-4 shadow-[var(--shadow-lift)] ring-1 ring-sand-200 sm:-right-8">
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Sâmbătă, 12 iunie</p>
        <p className="mt-1 font-display text-lg font-semibold">Andrei &amp; Maria</p>
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
          <dt className="text-slate-500">Sala</dt>
          <dd className="text-right font-medium text-ink">Palatul Florilor</dd>
          <dt className="text-slate-500">Preț agreat</dt>
          <dd className="text-right font-medium text-ink">1.800 €</dd>
          <dt className="text-slate-500">Invitați</dt>
          <dd className="text-right font-medium text-ink">120</dd>
        </dl>
      </div>
      <div className="absolute -left-3 top-10 hidden items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-medium shadow-[var(--shadow-lift)] ring-1 ring-sand-200 sm:flex">
        <GripVertical className="size-3.5 text-slate-400" /> Cerere nouă · Ioana &amp; Mihai
      </div>
    </div>
  );
}
