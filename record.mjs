// Guarda solicitudes de instructor, inscripciones y reportes en el almacenamiento central.
import { st, newId, safeId, clean, json } from "../lib/admin.mjs";
const TYPES = { solicitud: ["solicitudes", "sol"], inscripcion: ["inscripciones", "ins"], reporte: ["reportes", "rep"] };
export default async (req) => {
  if (req.method !== "POST") return json({ ok: false }, 405);
  try {
    const { tipo, data } = await req.json();
    const t = TYPES[tipo]; if (!t || !data) return json({ ok: false }, 400);
    const d = clean(data) || {};
    const id = safeId(d.id) || newId(t[1]);
    const now = new Date().toISOString();
    const rec = { ...d, id, recibido: now };
    if (tipo === "solicitud") { rec.estado = "recibida"; rec.checks = {}; rec.historial = [{ f: now, t: "Solicitud recibida" }]; }
    if (tipo === "inscripcion") { rec.estado_pago = "pendiente"; rec.email = String(d.email || "").toLowerCase(); rec.historial = [{ f: now, t: "Inscripción recibida" }]; }
    if (tipo === "reporte") { rec.estado = "nuevo"; }
    await st(t[0]).setJSON(id, rec);
    return json({ ok: true, id });
  } catch (e) { return json({ ok: false, error: String(e.message || e) }, 500); }
};
