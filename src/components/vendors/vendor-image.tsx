"use client";
// Persoana 1 — imagine furnizor cu fallback elegant (gradient + iconita categoriei) daca URL-ul nu merge
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { CategoryIcon } from "@/components/icons";
import { CATEGORY_META, type VendorCategory } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function VendorImage({
  src,
  category,
  alt,
  className,
}: {
  src?: string | null;
  category: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const color = CATEGORY_META[category as VendorCategory]?.color ?? "#64748b";

  if (!src || failed) {
    return (
      <div
        className={cn("relative grid place-items-center overflow-hidden", className)}
        style={{ background: `linear-gradient(140deg, ${color}14, ${color}3d)` }}
        aria-label={alt}
        role="img"
      >
        <div className="bg-dots absolute inset-0 opacity-60" />
        <span
          className="relative grid size-14 place-items-center rounded-2xl bg-white/80 shadow-[var(--shadow-card)] backdrop-blur"
          style={{ color }}
        >
          <CategoryIcon category={category} className="size-7" />
        </span>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={cn("object-cover transition-opacity duration-500", loaded ? "opacity-100" : "opacity-0", className)}
      style={{ background: `${color}1a` }}
    />
  );
}
