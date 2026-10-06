// Diagnóstico: muestra qué partes están configuradas (nunca muestra valores secretos).
import { st } from "../lib/admin.mjs";
export default async () => {
  const has = (k) => Boolean(process.env[k]);
  const out = {
    funciones: "activas",
    ADMIN_PASSWORD: has("ADMIN_PASSWORD") ? "ok" : "FALTA",
    ADMIN_LINK_SECRET: has("ADMIN_LINK_SECRET") ? "ok" : "FALTA",
    NETLIFY_API_TOKEN: has("NETLIFY_API_TOKEN") ? "ok" : "FALTA",
    NETLIFY_SITE_ID: has("NETLIFY_SITE_ID") || has("SITE_ID") ? "ok" : "FALTA",
    almacenamiento: "sin probar",
    conexion_netlify_forms: "sin probar",
  };
  try { await st("solicitudes").list(); out.almacenamiento = "ok"; } catch (e) { out.almacenamiento = "ERROR: " + String(e.message || e).slice(0, 120); }
  const token = process.env.NETLIFY_API_TOKEN, site = process.env.NETLIFY_SITE_ID || process.env.SITE_ID;
  if (token && site) {
    try {
      const r = await fetch(`https://api.netlify.com/api/v1/sites/${site}/submissions?per_page=100`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) { const j = await r.json(); out.conexion_netlify_forms = `ok (${j.length} envíos encontrados)`; }
      else out.conexion_netlify_forms = r.status === 401 ? "ERROR: el token no es válido" : r.status === 404 ? "ERROR: el ID del proyecto no es correcto" : "ERROR " + r.status;
    } catch (e) { out.conexion_netlify_forms = "ERROR: " + String(e.message || e).slice(0, 120); }
  }
  return new Response(JSON.stringify(out, null, 2), { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
};
