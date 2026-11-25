"use client";
// Persoana 3 — incarcare doar in browser a editorului (react-konva foloseste <canvas>, fara SSR)
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import type { PlanGuest } from "@/components/floorplan/floor-planner";
import type { PlanTable } from "@/components/floorplan/geometry";

const FloorPlanner = dynamic(() => import("@/components/floorplan/floor-planner"), {
  ssr: false,
  loading: () => (
    <div className="grid h-[calc(100vh-170px)] min-h-[560px] place-items-center rounded-2xl bg-white ring-1 ring-sand-200/80">
      <span className="inline-flex items-center gap-2 text-sm text-slate-500">
        <Loader2 className="size-4 animate-spin" /> Se încarcă planul sălii...
      </span>
    </div>
  ),
});

export function FloorPlannerClient(props: { initialTables: PlanTable[]; initialGuests: PlanGuest[] }) {
  return <FloorPlanner {...props} />;
}
