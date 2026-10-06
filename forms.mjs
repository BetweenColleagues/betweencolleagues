// Trae los envíos de Netlify Forms (incluidos los anteriores) al almacenamiento del panel.
// Variables: NETLIFY_API_TOKEN (token personal de Netlify) y NETLIFY_SITE_ID (ID del proyecto).
import { st } from "./admin.mjs";

const fileList = (v) => (Array.isArray(v) ? v : v ? [v] : []).filter((f) => f && f.url).map((f) => ({ url: f.url, nombre: f.filename || "archivo" }));
const near = (a, b) => Math.abs(new Date(a) - new Date(b)) < 15 * 60e3;

export async function syncForms() {
  const token = process.env.NETLIFY_API_TOKEN, site = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
  if (!token || !site) return { synced: false };
  const res = await fetch(`https://api.netlify.com/api/v1/sites/${site}/submissions?per_page=100`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return { synced: false, status: res.status };
  const subs = await res.json();
  const S = { solicitudes: st("solicitudes"), inscripciones: st("inscripciones"), reportes: st("reportes") };
  const existing = {};
  for (const k of Object.keys(S)) {
    const { blobs } = await S[k].list(); existing[k] = [];
    for (const b of blobs) { const v = await S[k].get(b.key, { type: "json" }); if (v) existing[k].push(v); }
  }
  let added = 0;
  for (const sub of subs) {
    const d = sub.data || {}, form = sub.form_name, when = sub.created_at, id = "nf-" + sub.id;
    const email = String(d.email || d.correo || "").toLowerCase();
    if (form === "solicitud-instructor") {
      if (existing.solicitudes.some((x) => x.id === id || (x.correo === email && near(x.recibido, when)))) continue;
      const exe = fileList(d.documento_exequatur).concat(fileList(d.documento_licencia)), tit = fileList(d.documentos_titulos);
      const rec = { id, origen: "netlify", recibido: when, nombre: d.nombre || "", correo: email, whatsapp: d.whatsapp || "", profesion: d.profesion || "", pais: d.pais_ejercicio || "República Dominicana", exequatur: d.exequatur || "", licencia: d.licencia_extranjera || "", colegiatura: d.numero_colegiatura || "", areas: Array.isArray(d.areas) ? d.areas.join(", ") : (d.areas || ""), curso: d.titulo_taller || "", docs: exe.map((f) => ({ ...f, tipo: "Exequátur o licencia" })).concat(tit.map((f) => ({ ...f, tipo: "Título" }))), docExe: exe.length, docTit: tit.length, ai: d.consentimiento_ai === "Sí", estado: "recibida", checks: {}, historial: [{ f: when, t: "Solicitud recibida" }] };
      await S.solicitudes.setJSON(id, rec); existing.solicitudes.push(rec); added++;
    } else if (form === "inscripciones") {
      if (existing.inscripciones.some((x) => x.id === id || (x.email === email && near(x.recibido, when)))) continue;
      const paid = /^pagado/i.test(d.estado_pago || "");
      const rec = { id, origen: "netlify", recibido: when, nombre: d.nombre || "", email, curso: d.curso || "", metodo: d.metodo || "", monto: d.monto || "", estado_pago: paid ? "pagado" : "pendiente", historial: [{ f: when, t: "Inscripción recibida" }] };
      await S.inscripciones.setJSON(id, rec); existing.inscripciones.push(rec); added++;
    } else if (form === "reportes") {
      if (existing.reportes.some((x) => x.id === id || (x.descripcion === d.descripcion && near(x.recibido, when)))) continue;
      const rec = { id, origen: "netlify", recibido: when, tipo: d.tipo || "", donde: d.donde || "", descripcion: d.descripcion || "", email: d.email || "", reportado_por: d.reportado_por || "", estado: "nuevo" };
      await S.reportes.setJSON(id, rec); existing.reportes.push(rec); added++;
    }
  }
  return { synced: true, added };
}
