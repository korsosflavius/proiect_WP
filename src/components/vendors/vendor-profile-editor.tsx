"use client";
// Persoana 1 — 1.2 formular profil furnizor + CRUD pachete + galerie (upload fisier sau URL)
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Link2, Package, Pencil, Plus, Save, Trash2, Upload } from "lucide-react";
import { Button, Card, CardHeader, Field, Input, Modal, Textarea } from "@/components/ui";
import { VendorImage } from "@/components/vendors/vendor-image";
import { CATEGORY_META, type VendorCategory } from "@/lib/constants";
import { api } from "@/lib/fetcher";
import { formatMoney } from "@/lib/utils";

type Vendor = {
  businessName: string;
  category: string;
  description: string;
  city: string;
  basePrice: number;
  phone: string | null;
  capacity: number | null;
  imageUrl: string | null;
};
type Pkg = { id: string; name: string; description: string | null; price: number };
type Img = { id: string; url: string; caption: string | null };

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const { url } = await api<{ url: string }>("/api/upload", { method: "POST", body: fd });
  return url;
}

export function VendorProfileEditor({ vendor, packages, gallery }: { vendor: Vendor; packages: Pkg[]; gallery: Img[] }) {
  const router = useRouter();
  const [form, setForm] = useState(vendor);
  const [saving, setSaving] = useState(false);
  const [pkgModal, setPkgModal] = useState<Partial<Pkg> | null>(null);
  const [imgUrl, setImgUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const coverInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const meta = CATEGORY_META[vendor.category as VendorCategory];

  const set = <K extends keyof Vendor>(k: K, v: Vendor[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api("/api/vendors/me", { method: "PATCH", json: { ...form, imageUrl: form.imageUrl ?? "" } });
      toast.success("Profil salvat");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function onCover(file?: File) {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file);
      set("imageUrl", url);
      await api("/api/vendors/me", { method: "PATCH", json: { imageUrl: url } });
      toast.success("Coperta a fost actualizată");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function addImage(url: string) {
    await api("/api/vendors/me/gallery", { method: "POST", json: { url } });
    router.refresh();
  }

  async function onGalleryFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const f of Array.from(files)) await addImage(await uploadFile(f));
      toast.success("Imagini adăugate în galerie");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function removeImage(id: string) {
    try {
      await api(`/api/vendors/me/gallery/${id}`, { method: "DELETE" });
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function savePackage() {
    if (!pkgModal) return;
    try {
      const body = { name: pkgModal.name, description: pkgModal.description, price: pkgModal.price };
      if (pkgModal.id) await api(`/api/vendors/me/packages/${pkgModal.id}`, { method: "PATCH", json: body });
      else await api("/api/vendors/me/packages", { method: "POST", json: body });
      toast.success("Pachet salvat");
      setPkgModal(null);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function deletePackage(id: string) {
    try {
      await api(`/api/vendors/me/packages/${id}`, { method: "DELETE" });
      toast.success("Pachet șters");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
      <Card>
        <CardHeader title="Informații generale" description={`Categoria: ${meta?.label}`} />
        <form onSubmit={saveProfile} className="space-y-4 p-5">
          <div className="relative h-44 overflow-hidden rounded-2xl">
            <VendorImage src={form.imageUrl} category={vendor.category} alt="Copertă" className="h-full w-full" />
            <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-black/60 to-transparent p-3">
              <Button type="button" size="sm" variant="secondary" loading={uploading} onClick={() => coverInput.current?.click()}>
                <Upload className="size-4" /> Încarcă copertă
              </Button>
              <input ref={coverInput} type="file" accept="image/*" hidden onChange={(e) => onCover(e.target.files?.[0])} />
            </div>
          </div>
          <Field label="URL imagine copertă" hint="Sau încarcă un fișier de mai sus">
            <Input value={form.imageUrl ?? ""} placeholder="https://..." onChange={(e) => set("imageUrl", e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Numele afacerii">
              <Input required value={form.businessName} onChange={(e) => set("businessName", e.target.value)} />
            </Field>
            <Field label="Oraș">
              <Input required value={form.city} onChange={(e) => set("city", e.target.value)} />
            </Field>
            <Field label="Preț de bază (€)">
              <Input type="number" min={0} required value={form.basePrice} onChange={(e) => set("basePrice", Number(e.target.value))} />
            </Field>
            <Field label="Telefon">
              <Input value={form.phone ?? ""} onChange={(e) => set("phone", e.target.value)} placeholder="07xx xxx xxx" />
            </Field>
            {vendor.category === "VENUE" && (
              <Field label="Capacitate sală (invitați)">
                <Input type="number" min={0} value={form.capacity ?? ""} onChange={(e) => set("capacity", e.target.value ? Number(e.target.value) : null)} />
              </Field>
            )}
          </div>
          <Field label="Descriere">
            <Textarea rows={6} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Ce vă face speciali? Experiență, stil, ce include serviciul..." />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" loading={saving}>
              <Save className="size-4" /> Salvează profilul
            </Button>
          </div>
        </form>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader
            title="Pachete de servicii"
            icon={<Package className="size-4" />}
            action={
              <Button size="sm" variant="secondary" onClick={() => setPkgModal({ name: "", price: vendor.basePrice, description: "" })}>
                <Plus className="size-4" /> Pachet
              </Button>
            }
          />
          <div className="divide-y divide-sand-100">
            {packages.length === 0 && <p className="p-5 text-sm text-slate-500">Nu ai pachete. Mirii vor vedea doar prețul de bază.</p>}
            {packages.map((p) => (
              <div key={p.id} className="flex items-start justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">{p.name}</p>
                  {p.description && <p className="text-sm text-slate-500">{p.description}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <span className="mr-2 font-semibold text-brand-600">{formatMoney(p.price)}</span>
                  <button className="rounded-lg p-1.5 text-slate-400 hover:bg-black/5 hover:text-ink" onClick={() => setPkgModal(p)}>
                    <Pencil className="size-4" />
                  </button>
                  <button className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" onClick={() => deletePackage(p.id)}>
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Galerie"
            description={`${gallery.length} imagini`}
            icon={<ImagePlus className="size-4" />}
            action={
              <Button size="sm" variant="secondary" loading={uploading} onClick={() => galleryInput.current?.click()}>
                <Upload className="size-4" /> Încarcă
              </Button>
            }
          />
          <input ref={galleryInput} type="file" accept="image/*" multiple hidden onChange={(e) => onGalleryFiles(e.target.files)} />
          <div className="p-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input className="pl-9" placeholder="sau lipește un URL de imagine" value={imgUrl} onChange={(e) => setImgUrl(e.target.value)} />
              </div>
              <Button
                variant="secondary"
                disabled={!imgUrl}
                onClick={async () => {
                  try {
                    await addImage(imgUrl);
                    setImgUrl("");
                    toast.success("Imagine adăugată");
                  } catch (err) {
                    toast.error((err as Error).message);
                  }
                }}
              >
                Adaugă
              </Button>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {gallery.map((g) => (
                <div key={g.id} className="group relative aspect-square overflow-hidden rounded-xl ring-1 ring-sand-200/80">
                  <VendorImage src={g.url} category={vendor.category} alt="" className="h-full w-full" />
                  <button
                    onClick={() => removeImage(g.id)}
                    className="absolute right-1.5 top-1.5 rounded-lg bg-white/90 p-1.5 text-rose-600 opacity-0 shadow transition group-hover:opacity-100"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <Modal
        open={!!pkgModal}
        onClose={() => setPkgModal(null)}
        title={pkgModal?.id ? "Editează pachetul" : "Pachet nou"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setPkgModal(null)}>Renunță</Button>
            <Button onClick={savePackage}>Salvează</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Nume pachet">
            <Input value={pkgModal?.name ?? ""} onChange={(e) => setPkgModal((p) => ({ ...p, name: e.target.value }))} placeholder="Ex: Pachet Gold" />
          </Field>
          <Field label="Preț (€)">
            <Input type="number" min={0} value={pkgModal?.price ?? 0} onChange={(e) => setPkgModal((p) => ({ ...p, price: Number(e.target.value) }))} />
          </Field>
          <Field label="Ce include">
            <Textarea value={pkgModal?.description ?? ""} onChange={(e) => setPkgModal((p) => ({ ...p, description: e.target.value }))} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
