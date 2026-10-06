// Cambios hechos desde el panel de la creadora.
import { isAdmin, st, STORES, safeId, clean, json } from "../lib/admin.mjs";
const ALLOWED = {
  solicitudes: ["estado", "checks", "historial", "codigo", "aiReport", "suspendido"],
  propuestas: ["estado", "historial", "checks", "aiReport", "mensaje"],
  inscripciones: ["estado_pago", "historial", "nota"],
  reportes: ["estado", "nota"],
};
export default async (req) => {
  if (!isAdmin(req)) return json({ ok: false }, 401);
  if (req.method !== "POST") return json({ ok: false }, 405);
  try {
    const { store, id, patch } = await req.json();
    if (!STORES.includes(store)) return json({ ok: false }, 400);
    const s = st(store), key = safeId(id), cur = await s.get(key, { type: "json" });
    if (!cur) return json({ ok: false, error: "no encontrado" }, 404);
    for (const k of ALLOWED[store]) if (patch && k in patch) cur[k] = clean(patch[k]);
    if (store === "propuestas" && cur.estado === "aprobado" && !cur.publicado) cur.publicado = new Date().toISOString();
    cur.actualizado = new Date().toISOString();
    await s.setJSON(key, cur);
    return json({ ok: true });
  } catch (e) { return json({ ok: false, error: String(e.message || e) }, 500); }
};
