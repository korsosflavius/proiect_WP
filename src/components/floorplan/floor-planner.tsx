"use client";
// ============================================================================
// Persoana 3 — 3.1 Editor 2D Sala (top-down, react-konva) + 3.2 Drag & Drop invitati (stil joc)
// ----------------------------------------------------------------------------
//  * Split-screen: stanga 25% lista cautabila de invitati, dreapta 75% canvas cu grila, zoom & pan
//  * Mese rotunde / dreptunghiulare / prezidiu / ring de dans: adaugare, mutare (drag), rotire
//    (Transformer), stergere, capacitate; coordonatele (posX, posY, rotation) se salveaza automat
//  * Invitatii se trag din lista (HTML5 drag) direct pe scaune; scaunele ocupate pot fi trase
//    pe alt scaun (SWAP) sau inapoi in lista (ridicare de la masa)
//  * Hover pe scaun: nume + meniu (frunza verde = vegetarian/vegan) + alergii (avertizare rosie)
// ============================================================================
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Circle, Group, Layer, Line, Rect, Stage, Text, Transformer } from "react-konva";
import type Konva from "konva";
import { toast } from "sonner";
import {
  AlertTriangle,
  Baby,
  Check,
  CircleDot,
  Leaf,
  Loader2,
  Maximize,
  Minus,
  Music,
  Plus,
  RectangleHorizontal,
  RotateCcw,
  RotateCw,
  Search,
  Trash2,
  UserMinus,
  Utensils,
  Crown,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button, Chip, Input } from "@/components/ui";
import { MENU_META, MENU_TYPES, TABLE_SHAPE_META, type MenuType, type TableShape } from "@/lib/constants";
import { api } from "@/lib/fetcher";
import { cn, initials } from "@/lib/utils";
import {
  GRID,
  ROOM,
  SEAT_R,
  findSeatAt,
  findTableAt,
  seatPositions,
  tableSize,
  toWorld,
  type PlanTable,
} from "@/components/floorplan/geometry";
import { MenuIcon as MenuIconBase } from "@/components/icons";

export type PlanGuest = {
  id: string;
  fullName: string;
  group: string | null;
  menuType: string;
  allergies: string[];
  tableId: string | null;
  seatIndex: number | null;
};

type SeatRef = { tableId: string; seatIndex: number };
type Point = { x: number; y: number };

const BRAND = "#dc1d58";
const MIN_SCALE = 0.3;
const MAX_SCALE = 2.5;

function MenuIcon({ menu, className }: { menu: string; className?: string }) {
  if (menu === "VEGETARIAN" || menu === "VEGAN") return <Leaf className={cn("text-green-600", className)} />;
  if (menu === "KIDS") return <Baby className={cn("text-orange-500", className)} />;
  return <Utensils className={cn("text-indigo-500", className)} />;
}

/** Scara si pozitia care incadreaza toata sala in zona vizibila */
function fitView(width: number, height: number) {
  const scale = Math.min((width - 48) / ROOM.width, (height - 48) / ROOM.height, 1.2);
  return { scale, x: (width - ROOM.width * scale) / 2, y: (height - ROOM.height * scale) / 2 };
}

export default function FloorPlanner({
  initialTables,
  initialGuests,
}: {
  initialTables: PlanTable[];
  initialGuests: PlanGuest[];
}) {
  const [tables, setTables] = useState(initialTables);
  const [guests, setGuests] = useState(initialGuests);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const tableNodes = useRef(new Map<string, Konva.Group>());

  const [size, setSize] = useState({ width: 0, height: 0 });
  const [view, setView] = useState({ scale: 0.8, x: 20, y: 20 });
  const fitted = useRef(false);

  const [dropTarget, setDropTarget] = useState<SeatRef | null>(null);
  const [drag, setDrag] = useState<{ guestId: string; start: Point; pos: Point; moved: boolean } | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; guest: PlanGuest; label: string } | null>(null);
  const [seatMenu, setSeatMenu] = useState<{ x: number; y: number; guest: PlanGuest } | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [hoverTable, setHoverTable] = useState<string | null>(null);

  // filtre panou stanga
  const [tab, setTab] = useState<"unseated" | "seated">("unseated");
  const [q, setQ] = useState("");
  const [menuFilter, setMenuFilter] = useState<string | null>(null);
  const [allergyOnly, setAllergyOnly] = useState(false);

  /* -------------------------------------------------------------- derivate */
  const occupancy = useMemo(() => {
    const m = new Map<string, PlanGuest>();
    for (const g of guests) if (g.tableId && g.seatIndex !== null) m.set(`${g.tableId}:${g.seatIndex}`, g);
    return m;
  }, [guests]);

  const tableById = useMemo(() => new Map(tables.map((t) => [t.id, t])), [tables]);
  const selected = selectedId ? tableById.get(selectedId) ?? null : null;
  const seatedCount = guests.filter((g) => g.tableId).length;
  const totalSeats = tables.reduce((s, t) => s + t.capacity, 0);

  const panelGuests = useMemo(() => {
    const needle = q.trim().toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
    return guests
      .filter((g) => (tab === "unseated" ? !g.tableId : !!g.tableId))
      .filter((g) => !menuFilter || g.menuType === menuFilter)
      .filter((g) => !allergyOnly || g.allergies.length > 0)
      .filter((g) => {
        if (!needle) return true;
        return `${g.fullName} ${g.group ?? ""}`.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "").includes(needle);
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [guests, tab, q, menuFilter, allergyOnly]);

  /* ------------------------------------------------------ dimensiune canvas */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry!.contentRect;
      setSize({ width, height });
      // prima masurare: incadram sala in ecran
      if (!fitted.current && width > 0) {
        fitted.current = true;
        setView(fitView(width, height));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  function fitToRoom() {
    if (size.width) setView(fitView(size.width, size.height));
  }

  /* ----------------------------------------------- Transformer (rotire) */
  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;
    const node = selectedId ? tableNodes.current.get(selectedId) : undefined;
    tr.nodes(node ? [node] : []);
    tr.getLayer()?.batchDraw();
  }, [selectedId, tables]);

  /* ------------------------------------------------------------- salvare */
  const saveTable = useCallback(async (id: string, patch: Partial<PlanTable>) => {
    setSaveState("saving");
    try {
      await api(`/api/tables/${id}`, { method: "PATCH", json: patch });
      setSaveState("saved");
    } catch (e) {
      setSaveState("error");
      toast.error((e as Error).message);
    }
  }, []);

  function updateTable(id: string, patch: Partial<PlanTable>, persist = true) {
    setTables((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    if (persist) void saveTable(id, patch);
  }

  async function addTable(shape: TableShape) {
    // in centrul zonei vizibile
    const cx = (size.width / 2 - view.x) / view.scale;
    const cy = (size.height / 2 - view.y) / view.scale;
    const n = tables.filter((t) => t.shape === "ROUND" || t.shape === "RECTANGLE").length + 1;
    const label = shape === "STAGE" ? "Prezidiu" : shape === "DANCE_FLOOR" ? "Ring Dans" : `Masa ${n}`;
    const body = {
      label,
      shape,
      capacity: TABLE_SHAPE_META[shape].defaultCapacity,
      posX: Math.round(cx / 10) * 10,
      posY: Math.round(cy / 10) * 10,
      rotation: 0,
    };
    setSaveState("saving");
    try {
      const { table } = await api<{ table: PlanTable }>("/api/tables", { method: "POST", json: body });
      setTables((ts) => [...ts, table]);
      setSelectedId(table.id);
      setSaveState("saved");
    } catch (e) {
      setSaveState("error");
      toast.error((e as Error).message);
    }
  }

  async function deleteTable(id: string) {
    const t = tableById.get(id);
    if (!t) return;
    const seated = guests.filter((g) => g.tableId === id).length;
    if (seated > 0 && !confirm(`${t.label} are ${seated} invitați așezați. Ștergi masa? Invitații vor redeveni neașezați.`)) return;
    const snapshot = { tables, guests };
    setTables((ts) => ts.filter((x) => x.id !== id));
    setGuests((gs) => gs.map((g) => (g.tableId === id ? { ...g, tableId: null, seatIndex: null } : g)));
    setSelectedId(null);
    setSaveState("saving");
    try {
      await api(`/api/tables/${id}`, { method: "DELETE" });
      setSaveState("saved");
    } catch (e) {
      setTables(snapshot.tables);
      setGuests(snapshot.guests);
      setSaveState("error");
      toast.error((e as Error).message);
    }
  }

  function changeCapacity(t: PlanTable, delta: number) {
    const min = t.shape === "ROUND" ? 4 : 2;
    const max = t.shape === "ROUND" ? 12 : t.shape === "STAGE" ? 12 : 24;
    const capacity = Math.min(max, Math.max(min, t.capacity + delta));
    if (capacity === t.capacity) return;
    const lost = guests.filter((g) => g.tableId === t.id && (g.seatIndex ?? 0) >= capacity);
    if (lost.length) {
      setGuests((gs) => gs.map((g) => (lost.some((l) => l.id === g.id) ? { ...g, tableId: null, seatIndex: null } : g)));
      toast.info(`${lost.map((l) => l.fullName).join(", ")} ${lost.length === 1 ? "a fost ridicat" : "au fost ridicați"} de la masă`);
    }
    updateTable(t.id, { capacity });
  }

  /** Asaza un invitat (optimist) cu SWAP daca scaunul e ocupat; null = ridica de la masa */
  async function seatGuest(guestId: string, target: SeatRef | null) {
    const guest = guests.find((g) => g.id === guestId);
    if (!guest) return;
    if (target && guest.tableId === target.tableId && guest.seatIndex === target.seatIndex) return;
    const snapshot = guests;
    const occupant = target ? occupancy.get(`${target.tableId}:${target.seatIndex}`) : undefined;

    setGuests((gs) =>
      gs.map((g) => {
        if (g.id === guestId) return { ...g, tableId: target?.tableId ?? null, seatIndex: target?.seatIndex ?? null };
        if (occupant && g.id === occupant.id) return { ...g, tableId: guest.tableId, seatIndex: guest.seatIndex };
        return g;
      }),
    );
    setSaveState("saving");
    try {
      await api("/api/seating", {
        method: "POST",
        json: { guestId, tableId: target?.tableId ?? null, seatIndex: target?.seatIndex ?? null },
      });
      setSaveState("saved");
      if (occupant && target) {
        toast.success(
          guest.tableId
            ? `Schimb de locuri: ${guest.fullName} ⇄ ${occupant.fullName}`
            : `${guest.fullName} a luat locul lui ${occupant.fullName} (acum neașezat)`,
        );
      }
    } catch (e) {
      setGuests(snapshot);
      setSaveState("error");
      toast.error((e as Error).message);
    }
  }

  function firstFreeSeat(t: PlanTable): SeatRef | null {
    for (let i = 0; i < t.capacity; i++) if (!occupancy.has(`${t.id}:${i}`)) return { tableId: t.id, seatIndex: i };
    return null;
  }

  /** Tinta de drop la un punct din lume: scaunul cel mai apropiat sau primul loc liber al mesei de sub cursor */
  function resolveDrop(p: Point): SeatRef | null {
    const seat = findSeatAt(tables, p);
    if (seat) return { tableId: seat.tableId, seatIndex: seat.seatIndex };
    const t = findTableAt(tables, p);
    return t ? firstFreeSeat(t) : null;
  }

  function pointerWorld(): Point | null {
    return layerRef.current?.getRelativePointerPosition() ?? null;
  }

  /* --------------------------------------------- HTML5 drag din panoul stang */
  function onCanvasDragOver(e: React.DragEvent) {
    if (!e.dataTransfer.types.includes("text/wedcraft-guest")) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    stageRef.current?.setPointersPositions(e.nativeEvent);
    const p = pointerWorld();
    const target = p ? resolveDrop(p) : null;
    setDropTarget((prev) => (prev?.tableId === target?.tableId && prev?.seatIndex === target?.seatIndex ? prev : target));
  }

  function onCanvasDrop(e: React.DragEvent) {
    e.preventDefault();
    const guestId = e.dataTransfer.getData("text/wedcraft-guest");
    stageRef.current?.setPointersPositions(e.nativeEvent);
    const p = pointerWorld();
    const target = p ? resolveDrop(p) : null;
    setDropTarget(null);
    if (!guestId) return;
    if (!target) {
      const t = p ? findTableAt(tables, p) : null;
      toast.warning(t ? `${t.label} este plină` : "Trage invitatul peste un scaun sau o masă");
      return;
    }
    void seatGuest(guestId, target);
  }

  /* ---------------------- drag "stil joc" al unui invitat deja asezat (in canvas) */
  function startSeatDrag(e: Konva.KonvaEventObject<MouseEvent | TouchEvent>, guest: PlanGuest) {
    e.cancelBubble = true; // nu porni drag pe masa / pan pe stage
    const p = pointerWorld();
    if (!p) return;
    setTooltip(null);
    setSeatMenu(null);
    setDrag({ guestId: guest.id, start: p, pos: p, moved: false });
  }

  function onStagePointerMove() {
    if (!drag) return;
    const p = pointerWorld();
    if (!p) return;
    const moved = drag.moved || Math.hypot(p.x - drag.start.x, p.y - drag.start.y) > 4 / view.scale;
    setDrag({ ...drag, pos: p, moved });
    if (moved) {
      const target = resolveDrop(p);
      setDropTarget((prev) => (prev?.tableId === target?.tableId && prev?.seatIndex === target?.seatIndex ? prev : target));
    }
  }

  // eliberarea mouse-ului oriunde in pagina (inclusiv peste panoul stang => ridicare de la masa)
  useEffect(() => {
    if (!drag) return;
    const onUp = (ev: MouseEvent | TouchEvent) => {
      const current = drag;
      setDrag(null);
      setDropTarget(null);
      const guest = guests.find((g) => g.id === current.guestId);
      if (!guest) return;
      const targetEl = ev.target as Node | null;
      if (panelRef.current && targetEl && panelRef.current.contains(targetEl)) {
        void seatGuest(guest.id, null);
        toast.success(`${guest.fullName} a fost ridicat de la masă`);
        return;
      }
      if (!current.moved) {
        // click simplu pe scaun => meniu contextual
        const t = guest.tableId ? tableById.get(guest.tableId) : null;
        if (t && guest.seatIndex !== null) {
          const w = toWorld(t, seatPositions(t)[guest.seatIndex] ?? { x: 0, y: 0 });
          setSeatMenu({ x: w.x * view.scale + view.x, y: w.y * view.scale + view.y, guest });
        }
        return;
      }
      if (containerRef.current && targetEl && containerRef.current.contains(targetEl)) {
        const target = resolveDrop(current.pos);
        if (target) void seatGuest(guest.id, target);
      }
    };
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchend", onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag, guests, view]);

  /* ---------------------------------------------------------- zoom & pan */
  function onWheel(e: Konva.KonvaEventObject<WheelEvent>) {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const pointer = stage?.getPointerPosition();
    if (!stage || !pointer) return;
    const old = view.scale;
    const factor = e.evt.deltaY > 0 ? 1 / 1.08 : 1.08;
    const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, old * factor));
    const world = { x: (pointer.x - view.x) / old, y: (pointer.y - view.y) / old };
    setView({ scale, x: pointer.x - world.x * scale, y: pointer.y - world.y * scale });
  }

  function zoomBy(factor: number) {
    const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, view.scale * factor));
    const c = { x: size.width / 2, y: size.height / 2 };
    const world = { x: (c.x - view.x) / view.scale, y: (c.y - view.y) / view.scale };
    setView({ scale, x: c.x - world.x * scale, y: c.y - world.y * scale });
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.key === "Escape") {
        setSelectedId(null);
        setSeatMenu(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* --------------------------------------------------------- grila sala */
  const gridLines = useMemo(() => {
    const lines: number[][] = [];
    for (let x = GRID; x < ROOM.width; x += GRID) lines.push([x, 0, x, ROOM.height]);
    for (let y = GRID; y < ROOM.height; y += GRID) lines.push([0, y, ROOM.width, y]);
    return lines;
  }, []);

  const dragGuest = drag?.moved ? guests.find((g) => g.id === drag.guestId) : null;

  /* ================================================================ RENDER */
  return (
    <div className="flex h-[calc(100vh-170px)] min-h-[560px] gap-4">
      {/* ------------------------------------------------ PANOU STANGA 25% */}
      <aside
        ref={panelRef}
        className={cn(
          "flex w-1/4 min-w-[250px] flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-sand-200/80 transition",
          dragGuest && "ring-2 ring-brand-400 bg-brand-50/50",
        )}
      >
        <div className="space-y-3 border-b border-sand-100 p-3">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-sand-100 p-1 text-sm font-medium">
            {(
              [
                ["unseated", `Neașezați (${guests.length - seatedCount})`],
                ["seated", `Așezați (${seatedCount})`],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={cn("rounded-lg py-1.5 transition", tab === k ? "bg-white shadow text-ink" : "text-slate-500 hover:text-ink")}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="Caută invitat..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {MENU_TYPES.map((m) => (
              <Chip key={m} className="px-2 py-1 text-xs" active={menuFilter === m} onClick={() => setMenuFilter(menuFilter === m ? null : m)}>
                <MenuIconBase menu={m} className="size-3" /> {MENU_META[m].label}
              </Chip>
            ))}
            <Chip className="px-2 py-1 text-xs" active={allergyOnly} onClick={() => setAllergyOnly(!allergyOnly)}>
              <AlertTriangle className="size-3" /> Alergii
            </Chip>
          </div>
        </div>

        {dragGuest && (
          <div className="mx-3 mt-3 rounded-xl border-2 border-dashed border-brand-300 bg-white p-3 text-center text-xs font-medium text-brand-600">
            <UserMinus className="mx-auto mb-1 size-5" />
            Eliberează aici pentru a-l ridica de la masă
          </div>
        )}

        <div className="thin-scroll flex-1 space-y-1.5 overflow-y-auto p-3">
          {panelGuests.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-400">
              {tab === "unseated" && guests.length > 0 && !q && !menuFilter && !allergyOnly ? "Toți invitații au loc la masă." : "Niciun invitat."}
            </p>
          )}
          {panelGuests.map((g) => {
            const meta = MENU_META[g.menuType as MenuType];
            const table = g.tableId ? tableById.get(g.tableId) : null;
            return (
              <div
                key={g.id}
                draggable={tab === "unseated"}
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/wedcraft-guest", g.id);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragEnd={() => setDropTarget(null)}
                className={cn(
                  "group flex items-center gap-2.5 rounded-xl bg-white p-2 ring-1 ring-sand-200/80 transition",
                  tab === "unseated" && "cursor-grab hover:-translate-y-0.5 hover:shadow-md hover:ring-brand-200 active:cursor-grabbing",
                )}
              >
                <span className="relative grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold text-white" style={{ background: meta?.color }}>
                  {initials(g.fullName)}
                  {g.allergies.length > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-rose-600 ring-2 ring-white">
                      <AlertTriangle className="size-2.5 text-white" />
                    </span>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{g.fullName}</p>
                  <p className="flex items-center gap-1 truncate text-xs text-slate-500">
                    <MenuIcon menu={g.menuType} className="size-3" /> {meta?.label}
                    {table ? <> · {table.label}, loc {(g.seatIndex ?? 0) + 1}</> : g.group ? <> · {g.group}</> : null}
                  </p>
                </div>
                {tab === "unseated" && selected && selected.capacity > 0 && (
                  <button
                    title={`Așază la ${selected.label}`}
                    onClick={() => {
                      const seat = firstFreeSeat(selected);
                      if (seat) void seatGuest(g.id, seat);
                      else toast.warning(`${selected.label} este plină`);
                    }}
                    className="rounded-lg p-1 text-slate-400 opacity-0 transition hover:bg-brand-50 hover:text-brand-600 group-hover:opacity-100"
                  >
                    <Plus className="size-4" />
                  </button>
                )}
                {tab === "seated" && (
                  <button
                    title="Ridică de la masă"
                    onClick={() => seatGuest(g.id, null)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <X className="size-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <div className="border-t border-sand-100 px-3 py-2 text-[11px] text-slate-400">
          Trage un invitat pe un scaun. Trage un scaun ocupat pe altul pentru schimb de locuri.
        </div>
      </aside>

      {/* ------------------------------------------------------ CANVAS 75% */}
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-sand-200/80">
        <div className="flex flex-wrap items-center gap-2 border-b border-sand-100 px-3 py-2">
          <Button size="sm" variant="secondary" onClick={() => addTable("ROUND")}><CircleDot className="size-4" /> Masă rotundă</Button>
          <Button size="sm" variant="secondary" onClick={() => addTable("RECTANGLE")}><RectangleHorizontal className="size-4" /> Dreptunghiulară</Button>
          <Button size="sm" variant="secondary" onClick={() => addTable("STAGE")}><Crown className="size-4" /> Prezidiu</Button>
          <Button size="sm" variant="secondary" onClick={() => addTable("DANCE_FLOOR")}><Music className="size-4" /> Ring dans</Button>
          <div className="ml-auto flex items-center gap-1">
            <span className="mr-2 inline-flex items-center gap-1.5 text-xs text-slate-500">
              {saveState === "saving" && <><Loader2 className="size-3.5 animate-spin" /> Se salvează...</>}
              {saveState === "saved" && <><Check className="size-3.5 text-emerald-600" /> Salvat automat</>}
              {saveState === "error" && <span className="text-rose-600">Eroare la salvare</span>}
              {saveState === "idle" && <>{seatedCount}/{totalSeats} locuri ocupate</>}
            </span>
            <Button size="sm" variant="ghost" onClick={() => zoomBy(1 / 1.2)} aria-label="Zoom out"><ZoomOut className="size-4" /></Button>
            <span className="w-12 text-center text-xs tabular-nums text-slate-500">{Math.round(view.scale * 100)}%</span>
            <Button size="sm" variant="ghost" onClick={() => zoomBy(1.2)} aria-label="Zoom in"><ZoomIn className="size-4" /></Button>
            <Button size="sm" variant="ghost" onClick={fitToRoom} aria-label="Încadrează"><Maximize className="size-4" /></Button>
          </div>
        </div>

        <div
          ref={containerRef}
          className={cn("relative flex-1 overflow-hidden bg-[#f6f1f4]", drag?.moved && "cursor-grabbing")}
          style={{ backgroundImage: "radial-gradient(#e6d9e0 1px, transparent 1px)", backgroundSize: "18px 18px" }}
          onDragOver={onCanvasDragOver}
          onDragLeave={() => setDropTarget(null)}
          onDrop={onCanvasDrop}
        >
          {size.width > 0 && (
            <Stage
              ref={stageRef}
              width={size.width}
              height={size.height}
              x={view.x}
              y={view.y}
              scaleX={view.scale}
              scaleY={view.scale}
              draggable={!drag}
              onWheel={onWheel}
              onDragEnd={(e) => {
                if (e.target === e.target.getStage()) setView((v) => ({ ...v, x: e.target.x(), y: e.target.y() }));
              }}
              onMouseMove={onStagePointerMove}
              onTouchMove={onStagePointerMove}
              onMouseDown={(e) => {
                const name = e.target.name();
                if (e.target === e.target.getStage() || name === "room") {
                  setSelectedId(null);
                  setSeatMenu(null);
                }
              }}
            >
              <Layer ref={layerRef}>
                {/* sala + grila subtila */}
                <Rect name="room" x={0} y={0} width={ROOM.width} height={ROOM.height} fill="#ffffff" cornerRadius={18} shadowColor="#9f1239" shadowOpacity={0.08} shadowBlur={30} stroke="#ecdfe6" strokeWidth={2} />
                {gridLines.map((pts, i) => (
                  <Line key={i} points={pts} stroke="#f4ecf0" strokeWidth={1} listening={false} />
                ))}
                <Text text="INTRARE" x={ROOM.width / 2 - 40} y={ROOM.height - 22} width={80} align="center" fontSize={11} fontStyle="bold" letterSpacing={3} fill="#c9b6c0" listening={false} />
                <Rect x={ROOM.width / 2 - 50} y={ROOM.height - 4} width={100} height={8} fill="#ecdfe6" cornerRadius={4} listening={false} />

                {tables.map((t) => {
                  const s = tableSize(t);
                  const seats = seatPositions(t);
                  const isSelected = t.id === selectedId;
                  const used = seats.filter((_, i) => occupancy.has(`${t.id}:${i}`)).length;
                  const isDance = t.shape === "DANCE_FLOOR";
                  const isStage = t.shape === "STAGE";
                  const full = !isDance && used === t.capacity;

                  return (
                    <Group
                      key={t.id}
                      ref={(node) => {
                        if (node) tableNodes.current.set(t.id, node);
                        else tableNodes.current.delete(t.id);
                      }}
                      x={t.posX}
                      y={t.posY}
                      rotation={t.rotation}
                      draggable={!drag}
                      onMouseDown={(e) => {
                        e.cancelBubble = true;
                        setSelectedId(t.id);
                        setSeatMenu(null);
                      }}
                      onTouchStart={() => setSelectedId(t.id)}
                      onMouseEnter={(e) => {
                        const c = e.target.getStage()?.container();
                        if (c && !drag) c.style.cursor = "move";
                        setHoverTable(t.id);
                      }}
                      onMouseLeave={(e) => {
                        const c = e.target.getStage()?.container();
                        if (c) c.style.cursor = "";
                        setHoverTable(null);
                      }}
                      onDragStart={() => setSeatMenu(null)}
                      onDragEnd={(e) => {
                        const node = e.target;
                        const posX = Math.round(node.x() / 10) * 10;
                        const posY = Math.round(node.y() / 10) * 10;
                        node.position({ x: posX, y: posY });
                        updateTable(t.id, { posX, posY });
                      }}
                      onTransformEnd={(e) => {
                        const node = e.target;
                        node.scaleX(1);
                        node.scaleY(1);
                        updateTable(t.id, { rotation: Math.round(node.rotation()) });
                      }}
                    >
                      {/* corpul mesei */}
                      {s.kind === "circle" ? (
                        <>
                          {/* fata de masa (contur exterior discret) */}
                          <Circle radius={s.r + 5} fill={isSelected ? "#fff1f4" : "#f8f4f6"} listening={false} />
                          <Circle radius={s.r} fill={full ? "#fffafb" : "#ffffff"} stroke={isSelected ? BRAND : hoverTable === t.id ? "#c9b3bf" : "#e3d6dd"} strokeWidth={isSelected ? 2.5 : 1.5} shadowColor="#1a1523" shadowOpacity={0.1} shadowBlur={14} shadowOffsetY={4} />
                          <Circle radius={s.r - 7} stroke="#f3ecef" strokeWidth={1} listening={false} />
                        </>
                      ) : (
                        <Rect
                          x={-s.width / 2}
                          y={-s.height / 2}
                          width={s.width}
                          height={s.height}
                          cornerRadius={isDance ? 18 : 12}
                          fill={isDance ? "#f5f3ff" : isStage ? "#fff1f4" : full ? "#fff1f4" : "#ffffff"}
                          stroke={isSelected ? BRAND : isDance ? "#c4b5fd" : isStage ? "#fb6890" : hoverTable === t.id ? "#c9b3bf" : "#e3d6dd"}
                          strokeWidth={isSelected ? 2.5 : 1.5}
                          dash={isDance ? [10, 8] : undefined}
                          shadowColor="#000"
                          shadowOpacity={isDance ? 0 : 0.08}
                          shadowBlur={12}
                          shadowOffsetY={4}
                        />
                      )}
                      {isDance && (
                        <Group rotation={-t.rotation} listening={false}>
                          <Text text="♫" fontSize={36} fill="#c4b5fd" width={60} offsetX={30} offsetY={30} align="center" />
                        </Group>
                      )}
                      <Group rotation={-t.rotation} listening={false}>
                        <Text text={t.label} fontSize={isDance ? 15 : 13} fontStyle="bold" fill={isDance ? "#7c3aed" : "#1c1427"} width={160} offsetX={80} offsetY={isDance ? -14 : isStage || s.kind === "rect" ? 12 : 14} align="center" />
                        {!isDance && (
                          <Text text={`${used}/${t.capacity}`} fontSize={11} fill={full ? BRAND : "#94a3b8"} width={80} offsetX={40} offsetY={-4} align="center" />
                        )}
                      </Group>

                      {/* scaunele */}
                      {seats.map((p, i) => {
                        const occupant = occupancy.get(`${t.id}:${i}`);
                        const isTarget = dropTarget?.tableId === t.id && dropTarget.seatIndex === i;
                        const isDragging = drag?.moved && occupant?.id === drag.guestId;
                        const color = occupant ? MENU_META[occupant.menuType as MenuType]?.color ?? "#64748b" : "#eef0f3";
                        return (
                          <Group
                            key={i}
                            x={p.x}
                            y={p.y}
                            rotation={-t.rotation}
                            opacity={isDragging ? 0.3 : 1}
                            onMouseDown={occupant ? (e) => startSeatDrag(e, occupant) : undefined}
                            onTouchStart={occupant ? (e) => startSeatDrag(e, occupant) : undefined}
                            onMouseEnter={(e) => {
                              const c = e.target.getStage()?.container();
                              if (c && !drag) c.style.cursor = occupant ? "grab" : "default";
                              if (occupant && !drag) {
                                const abs = e.currentTarget.getAbsolutePosition();
                                setTooltip({ x: abs.x, y: abs.y, guest: occupant, label: `${t.label} · loc ${i + 1}` });
                              }
                            }}
                            onMouseLeave={() => setTooltip(null)}
                          >
                            <Circle
                              radius={isTarget ? SEAT_R + 3 : SEAT_R}
                              fill={isTarget && !occupant ? "#ffe3ea" : color}
                              stroke={isTarget ? BRAND : "#ffffff"}
                              strokeWidth={isTarget ? 3 : 2}
                              shadowColor="#000"
                              shadowOpacity={occupant ? 0.18 : 0.06}
                              shadowBlur={4}
                              shadowOffsetY={1}
                            />
                            {occupant ? (
                              <Text text={initials(occupant.fullName)} fontSize={10} fontStyle="bold" fill="#ffffff" width={26} offsetX={13} offsetY={5} align="center" listening={false} />
                            ) : (
                              <Text text={String(i + 1)} fontSize={9} fill="#a3a3b3" width={26} offsetX={13} offsetY={4.5} align="center" listening={false} />
                            )}
                            {occupant && occupant.allergies.length > 0 && (
                              <Circle x={9} y={-9} radius={4.5} fill="#e11d48" stroke="#ffffff" strokeWidth={1.5} listening={false} />
                            )}
                            {occupant && (occupant.menuType === "VEGETARIAN" || occupant.menuType === "VEGAN") && (
                              <Circle x={-9} y={-9} radius={4.5} fill="#16a34a" stroke="#ffffff" strokeWidth={1.5} listening={false} />
                            )}
                          </Group>
                        );
                      })}
                    </Group>
                  );
                })}

                <Transformer
                  ref={trRef}
                  resizeEnabled={false}
                  rotateEnabled
                  rotationSnaps={[0, 45, 90, 135, 180, 225, 270, 315]}
                  rotationSnapTolerance={6}
                  rotateAnchorOffset={36}
                  borderStroke={BRAND}
                  borderDash={[6, 4]}
                  anchorStroke={BRAND}
                  anchorFill="#ffffff"
                  anchorSize={14}
                  anchorCornerRadius={7}
                  padding={SEAT_R + 14}
                />

                {/* "jucatorul" tras pe harta */}
                {dragGuest && drag && (
                  <Group x={drag.pos.x} y={drag.pos.y} listening={false}>
                    <Circle radius={SEAT_R + 4} fill={MENU_META[dragGuest.menuType as MenuType]?.color} stroke="#ffffff" strokeWidth={3} shadowColor="#000" shadowOpacity={0.3} shadowBlur={12} shadowOffsetY={6} />
                    <Text text={initials(dragGuest.fullName)} fontSize={11} fontStyle="bold" fill="#fff" width={30} offsetX={15} offsetY={5.5} align="center" />
                  </Group>
                )}
              </Layer>
            </Stage>
          )}

          {/* tooltip hover pe scaun */}
          {tooltip && !drag && !seatMenu && (
            <div
              className="pointer-events-none absolute z-20 w-56 -translate-x-1/2 rounded-xl bg-ink px-3 py-2.5 text-white shadow-xl animate-fade-in"
              style={{ left: tooltip.x, top: tooltip.y - SEAT_R * view.scale - 10, transform: "translate(-50%, -100%)" }}
            >
              <p className="font-semibold">{tooltip.guest.fullName}</p>
              <p className="text-[11px] text-white/60">{tooltip.label}{tooltip.guest.group ? ` · ${tooltip.guest.group}` : ""}</p>
              <p className="mt-1.5 flex items-center gap-1.5 text-xs">
                <MenuIcon menu={tooltip.guest.menuType} className="size-3.5" />
                Meniu {MENU_META[tooltip.guest.menuType as MenuType]?.label}
              </p>
              {tooltip.guest.allergies.length > 0 && (
                <p className="mt-1 flex items-start gap-1.5 text-xs text-rose-300">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-rose-400" /> Alergii: {tooltip.guest.allergies.join(", ")}
                </p>
              )}
            </div>
          )}

          {/* meniu contextual la click pe scaun ocupat */}
          {seatMenu && (
            <div
              className="absolute z-20 w-52 rounded-xl bg-white p-2 shadow-2xl ring-1 ring-sand-200 animate-pop"
              style={{ left: seatMenu.x, top: seatMenu.y + SEAT_R * view.scale + 8, transform: "translateX(-50%)" }}
            >
              <p className="px-2 pt-1 text-sm font-semibold">{seatMenu.guest.fullName}</p>
              <p className="flex items-center gap-1 px-2 pb-2 text-xs text-slate-500">
                <MenuIcon menu={seatMenu.guest.menuType} className="size-3" /> {MENU_META[seatMenu.guest.menuType as MenuType]?.label}
                {seatMenu.guest.allergies.length > 0 && <span className="text-rose-600"> · {seatMenu.guest.allergies.join(", ")}</span>}
              </p>
              <button
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-rose-600 hover:bg-rose-50"
                onClick={() => {
                  void seatGuest(seatMenu.guest.id, null);
                  setSeatMenu(null);
                }}
              >
                <UserMinus className="size-4" /> Ridică de la masă
              </button>
            </div>
          )}

          {/* panou proprietati masa selectata */}
          {selected && (
            <div className="absolute right-3 top-3 z-10 w-64 rounded-2xl bg-white/95 p-4 shadow-xl ring-1 ring-sand-200 backdrop-blur animate-pop">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{TABLE_SHAPE_META[selected.shape as TableShape]?.label}</p>
                <button className="rounded-md p-1 text-slate-400 hover:bg-black/5" onClick={() => setSelectedId(null)}><X className="size-4" /></button>
              </div>
              <Input
                key={selected.id}
                defaultValue={selected.label}
                maxLength={60}
                onBlur={(e) => {
                  const label = e.target.value.trim();
                  if (label && label !== selected.label) updateTable(selected.id, { label });
                }}
                onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
              />
              {selected.shape !== "DANCE_FLOOR" && (
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-slate-600">Locuri</span>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="secondary" className="size-8 p-0" onClick={() => changeCapacity(selected, -1)}><Minus className="size-4" /></Button>
                    <span className="w-8 text-center font-semibold tabular-nums">{selected.capacity}</span>
                    <Button size="sm" variant="secondary" className="size-8 p-0" onClick={() => changeCapacity(selected, 1)}><Plus className="size-4" /></Button>
                  </div>
                </div>
              )}
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-slate-600">Rotație <span className="tabular-nums text-slate-400">{Math.round(selected.rotation)}°</span></span>
                <div className="flex gap-1">
                  <Button size="sm" variant="secondary" className="size-8 p-0" onClick={() => updateTable(selected.id, { rotation: (selected.rotation - 15) % 360 })}><RotateCcw className="size-4" /></Button>
                  <Button size="sm" variant="secondary" className="size-8 p-0" onClick={() => updateTable(selected.id, { rotation: (selected.rotation + 15) % 360 })}><RotateCw className="size-4" /></Button>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-slate-400">Trage masa pentru a o muta sau folosește mânerul de sus pentru rotire.</p>
              <Button variant="ghost" size="sm" className="mt-2 w-full text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => deleteTable(selected.id)}>
                <Trash2 className="size-4" /> Șterge
              </Button>
            </div>
          )}

          {/* minimapa: vedere de ansamblu + click pentru navigare */}
          {size.width > 0 && (
            <button
              type="button"
              aria-label="Minimapă — click pentru a centra vederea"
              className="absolute bottom-3 right-3 z-10 hidden overflow-hidden rounded-xl bg-white/95 p-1.5 shadow-[var(--shadow-lift)] ring-1 ring-sand-200 backdrop-blur md:block"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const px = ((e.clientX - rect.left - 6) / (rect.width - 12)) * ROOM.width;
                const py = ((e.clientY - rect.top - 6) / (rect.height - 12)) * ROOM.height;
                setView((v) => ({ ...v, x: size.width / 2 - px * v.scale, y: size.height / 2 - py * v.scale }));
              }}
            >
              <svg viewBox={`0 0 ${ROOM.width} ${ROOM.height}`} className="block h-[96px] w-[144px]">
                <rect width={ROOM.width} height={ROOM.height} rx={28} fill="#faf7f8" stroke="#ece7e4" strokeWidth={8} />
                {tables.map((t) => {
                  const sz = tableSize(t);
                  const fill = t.shape === "DANCE_FLOOR" ? "#ddd6fe" : t.id === selectedId ? BRAND : "#d6c7cf";
                  return sz.kind === "circle" ? (
                    <circle key={t.id} cx={t.posX} cy={t.posY} r={sz.r + 16} fill={fill} />
                  ) : (
                    <rect
                      key={t.id}
                      x={t.posX - sz.width / 2}
                      y={t.posY - sz.height / 2}
                      width={sz.width}
                      height={sz.height}
                      rx={14}
                      fill={fill}
                      transform={`rotate(${t.rotation} ${t.posX} ${t.posY})`}
                    />
                  );
                })}
                <rect
                  x={-view.x / view.scale}
                  y={-view.y / view.scale}
                  width={size.width / view.scale}
                  height={size.height / view.scale}
                  fill="rgb(220 29 88 / 0.06)"
                  stroke={BRAND}
                  strokeWidth={10}
                  rx={16}
                />
              </svg>
            </button>
          )}

          {/* legenda */}
          <div className="pointer-events-none absolute bottom-3 left-3 flex max-w-[70%] flex-wrap gap-x-3 gap-y-1 rounded-xl bg-white/95 px-3 py-2 text-[11px] text-slate-600 shadow-[var(--shadow-card)] ring-1 ring-sand-200 backdrop-blur">
            <span className="flex items-center gap-1"><span className="size-2.5 rounded-full bg-[#eef0f3] ring-1 ring-sand-200" /> Liber</span>
            {MENU_TYPES.map((m) => (
              <span key={m} className="flex items-center gap-1"><span className="size-2.5 rounded-full" style={{ background: MENU_META[m].color }} /> {MENU_META[m].label}</span>
            ))}
            <span className="flex items-center gap-1"><span className="size-2.5 rounded-full bg-green-600" /> Veg.</span>
            <span className="flex items-center gap-1"><span className="size-2.5 rounded-full bg-rose-600" /> Alergii</span>
          </div>

          {tables.length === 0 && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="rounded-2xl bg-white/90 px-6 py-5 text-center shadow ring-1 ring-sand-200/80">
                <p className="font-semibold">Sala e goală</p>
                <p className="text-sm text-slate-500">Adaugă mese, prezidiul și ringul de dans din bara de sus.</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
