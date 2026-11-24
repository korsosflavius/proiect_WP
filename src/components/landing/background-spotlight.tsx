"use client";
// Comun — efect de fundal pentru landing page (DOAR pe "/").
// Fundalul paginii este o grila fina de puncte — ca planul unei sali pe hartie milimetrica.
// Cand mouse-ul se misca, punctele din jurul cursorului se "aprind" discret in culoarea brandului,
// ca un reflector care exploreaza planul. Stratul sta IN SPATELE continutului (nu trece peste text
// sau carduri) si e vizibil doar in miscare: se stinge cand cursorul sta pe loc sau la scroll.
// Dezactivat pe ecrane tactile si pentru utilizatorii cu "reduce motion".
import { useEffect, useRef } from "react";

const GRID = 22; // px — distanta dintre puncte (aceeasi in ambele straturi, deci se suprapun perfect)

export function BackgroundSpotlight() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const target = { x: 0, y: 0 };
    const pos = { x: 0, y: 0 };
    let started = false;
    let frame = 0;
    let idle: ReturnType<typeof setTimeout> | undefined;

    const setOpacity = (value: number, ms: number) => {
      el.style.transition = `opacity ${ms}ms ${value ? "ease-out" : "ease-in"}`;
      el.style.opacity = String(value);
    };

    const tick = () => {
      pos.x += (target.x - pos.x) * 0.18;
      pos.y += (target.y - pos.y) * 0.18;
      el.style.setProperty("--sx", `${pos.x}px`);
      el.style.setProperty("--sy", `${pos.y}px`);
      frame = Math.abs(target.x - pos.x) + Math.abs(target.y - pos.y) > 0.4 ? requestAnimationFrame(tick) : 0;
    };

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      if (!started) {
        // prima miscare: pornim direct de sub cursor (fara "zbor" din colt)
        started = true;
        pos.x = target.x;
        pos.y = target.y;
      }
      if (!frame) frame = requestAnimationFrame(tick);
      setOpacity(1, 250);
      clearTimeout(idle);
      idle = setTimeout(() => setOpacity(0, 1100), 700);
    };
    const onScroll = () => {
      clearTimeout(idle);
      setOpacity(0, 300);
    };
    const onLeave = () => setOpacity(0, 500);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", onScroll);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(frame);
      clearTimeout(idle);
    };
  }, []);

  const dots = (color: string, size: number) =>
    `radial-gradient(circle at center, ${color} ${size}px, transparent ${size + 0.6}px)`;
  const spot = "radial-gradient(circle 260px at var(--sx, -999px) var(--sy, -999px), #000 0%, rgb(0 0 0 / 0.45) 45%, transparent 100%)";

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      {/* grila de baza — abia vizibila, mereu prezenta */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: dots("rgb(26 21 35 / 0.07)", 1),
          backgroundSize: `${GRID}px ${GRID}px`,
          WebkitMaskImage: "linear-gradient(to bottom, #000 0%, #000 55%, rgb(0 0 0 / 0.4) 100%)",
          maskImage: "linear-gradient(to bottom, #000 0%, #000 55%, rgb(0 0 0 / 0.4) 100%)",
        }}
      />
      {/* reflectorul — aceleasi puncte, colorate, vizibile doar langa cursor si doar in miscare */}
      <div ref={ref} className="absolute inset-0 opacity-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle 320px at var(--sx, -999px) var(--sy, -999px), rgb(255 227 234 / 0.55), transparent 70%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: dots("rgb(220 29 88 / 0.55)", 1.3),
            backgroundSize: `${GRID}px ${GRID}px`,
            WebkitMaskImage: spot,
            maskImage: spot,
          }}
        />
      </div>
    </div>
  );
}
