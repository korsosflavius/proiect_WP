"use client";
// Persoana 1 — 1.2 galerie imagini furnizor cu lightbox (navigare cu sagetile)
/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff, X } from "lucide-react";
import { VendorImage } from "@/components/vendors/vendor-image";

type Img = { id: string; url: string; caption?: string | null };

export function Gallery({ images, category }: { images: Img[]; category: string }) {
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIndex(null);
      if (e.key === "ArrowRight") setIndex((i) => (i === null ? i : (i + 1) % images.length));
      if (e.key === "ArrowLeft") setIndex((i) => (i === null ? i : (i - 1 + images.length) % images.length));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, images.length]);

  if (images.length === 0) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-xl bg-sand-50 p-6 text-sm text-slate-500">
        <ImageOff className="size-4" /> Nicio imagine în galerie.
      </div>
    );
  }

  return (
    <>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {images.map((img, i) => (
          <button
            key={img.id}
            onClick={() => setIndex(i)}
            className="group relative aspect-[4/3] overflow-hidden rounded-xl ring-1 ring-sand-200/80"
          >
            <VendorImage src={img.url} category={category} alt={img.caption ?? "Imagine galerie"} className="h-full w-full transition duration-300 group-hover:scale-105" />
          </button>
        ))}
      </div>

      {index !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 animate-fade-in" onClick={() => setIndex(null)}>
          <button className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20" onClick={() => setIndex(null)}>
            <X className="size-6" />
          </button>
          {images.length > 1 && (
            <>
              <button
                className="absolute left-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); setIndex((index - 1 + images.length) % images.length); }}
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                className="absolute right-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); setIndex((index + 1) % images.length); }}
              >
                <ChevronRight className="size-6" />
              </button>
            </>
          )}
          <img
            src={images[index]!.url}
            alt=""
            className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl animate-pop"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="absolute bottom-6 text-sm text-white/70">{index + 1} / {images.length}</p>
        </div>
      )}
    </>
  );
}
