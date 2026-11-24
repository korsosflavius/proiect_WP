// Comun — schelet de incarcare afisat de Next.js (loading.tsx) cat timp pagina isi aduce datele
import { Skeleton } from "@/components/ui";

export function PageSkeleton({ variant = "dashboard" }: { variant?: "dashboard" | "grid" | "table" }) {
  return (
    <div aria-busy="true" aria-label="Se încarcă">
      <Skeleton className="mb-3 h-4 w-32" />
      <Skeleton className="mb-2 h-8 w-72" />
      <Skeleton className="mb-8 h-4 w-96 max-w-full" />
      {variant === "dashboard" && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[116px] rounded-2xl" />
            ))}
          </div>
          <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <Skeleton className="h-96 rounded-2xl" />
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        </>
      )}
      {variant === "grid" && (
        <>
          <Skeleton className="mb-6 h-36 rounded-2xl" />
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-80 rounded-2xl" />
            ))}
          </div>
        </>
      )}
      {variant === "table" && (
        <>
          <Skeleton className="mb-4 h-28 rounded-2xl" />
          <div className="space-y-2 rounded-2xl bg-white p-4 ring-1 ring-sand-200/80">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
