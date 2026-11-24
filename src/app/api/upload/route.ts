// Persoana 1 — 1.2 POST /api/upload: urcare imagine (galerie / coperta furnizor)
// Fisierele se salveaza local in folderul /uploads si sunt servite prin /api/uploads/:file
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { ApiError, handle, requireVendorId } from "@/lib/api";

const ALLOWED: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};
const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(req: Request) {
  return handle(async () => {
    await requireVendorId();
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new ApiError(400, "Lipsește fișierul");
    const ext = ALLOWED[file.type];
    if (!ext) throw new ApiError(400, "Sunt acceptate doar imagini JPG, PNG, WEBP sau GIF");
    if (file.size > MAX_BYTES) throw new ApiError(400, "Imaginea depășește 5 MB");

    const dir = path.join(process.cwd(), "uploads");
    await mkdir(dir, { recursive: true });
    const name = `${randomUUID()}${ext}`;
    await writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
    return { url: `/api/uploads/${name}` };
  });
}
