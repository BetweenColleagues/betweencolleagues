// Almacenamiento central y autenticación de la administradora.
// Variables de entorno: ADMIN_PASSWORD (obligatoria), ADMIN_EMAIL (opcional), ADMIN_LINK_SECRET (obligatoria).
import { getStore } from "@netlify/blobs";
import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";

export const STORES = ["solicitudes", "inscripciones", "reportes", "propuestas"];
export const st = (name) => getStore({ name, consistency: "strong" });
export const ADMIN_EMAIL = () => (process.env.ADMIN_EMAIL || "info@betweencolleague.com").toLowerCase();
const secret = () => { const s = process.env.ADMIN_LINK_SECRET; if (!s) throw new Error("Falta ADMIN_LINK_SECRET"); return s; };
const mac = (v) => createHmac("sha256", secret()).update(v).digest("hex");
const eq = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && timingSafeEqual(x, y); };

export function checkPassword(email, pw) {
  const want = process.env.ADMIN_PASSWORD;
  if (!want) throw new Error("Falta ADMIN_PASSWORD");
  return String(email || "").toLowerCase() === ADMIN_EMAIL() && eq(pw, want);
}
export function makeToken(hours = 12) { const exp = Date.now() + hours * 3600e3; return `${exp}.${mac("admin:" + exp)}`; }
export function isAdmin(req) {
  const h = req.headers.get("authorization") || "", tok = h.replace(/^Bearer\s+/i, "");
  const [exp, sig] = tok.split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  try { return eq(sig, mac("admin:" + exp)); } catch { return false; }
}
export const newId = (p) => p + "-" + Date.now().toString(36) + randomBytes(3).toString("hex");
export const safeId = (v) => String(v || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 60);
export const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
export async function listAll(name) {
  const s = st(name), { blobs } = await s.list(), out = [];
  for (const b of blobs) { const v = await s.get(b.key, { type: "json" }); if (v) out.push(v); }
  return out;
}
// Limpia un objeto: solo texto, números, booleanos y listas/objetos pequeños.
export function clean(v, depth = 0) {
  if (v == null) return v;
  if (typeof v === "string") return v.slice(0, 4000);
  if (typeof v === "number" || typeof v === "boolean") return v;
  if (depth > 4) return null;
  if (Array.isArray(v)) return v.slice(0, 60).map((x) => clean(x, depth + 1));
  if (typeof v === "object") { const o = {}; for (const k of Object.keys(v).slice(0, 60)) o[k.slice(0, 40)] = clean(v[k], depth + 1); return o; }
  return null;
}
