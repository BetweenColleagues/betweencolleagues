// Almacenamiento de propuestas de cursos (Netlify Blobs) y enlaces firmados para aprobar.
// Variable de entorno necesaria: ADMIN_LINK_SECRET (una frase larga y secreta).
import { getStore } from "@netlify/blobs";
import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";

export const store = () => getStore({ name: "propuestas", consistency: "strong" });
export const RD_PER_USD = Number(process.env.RD_PER_USD || 59);

export function sign(id, action) {
  const secret = process.env.ADMIN_LINK_SECRET;
  if (!secret) throw new Error("Falta ADMIN_LINK_SECRET");
  return createHmac("sha256", secret).update(`${id}:${action}`).digest("hex").slice(0, 32);
}
export function verify(id, action, token) {
  try {
    const a = Buffer.from(sign(id, action)), b = Buffer.from(String(token || ""));
    return a.length === b.length && timingSafeEqual(a, b);
  } catch { return false; }
}
export const newId = () => "c-" + Date.now().toString(36) + randomBytes(3).toString("hex");
export const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
export const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export function page(title, body) {
  return new Response(`<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} · betweencolleagues</title>
<style>body{margin:0;background:#F7F1E8;color:#2B3A33;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}main{max-width:640px;margin:48px auto;padding:0 20px}
.card{background:#fff;border:1px solid #E2DCCD;border-radius:20px;padding:28px;display:flex;flex-direction:column;gap:14px}h1{font-family:Georgia,serif;font-weight:500;font-size:28px;margin:0}
.brand{font-family:Georgia,serif;font-size:20px;margin-bottom:18px}.brand i{color:#9CA362}dl{display:grid;grid-template-columns:140px 1fr;gap:6px 12px;margin:0}dt{color:#55615A}dd{margin:0;white-space:pre-wrap}
button,.btn{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 24px;border-radius:999px;border:none;font-size:16px;font-weight:700;cursor:pointer;text-decoration:none}
.ok{background:#2E6B50;color:#fff}.red{background:#C62A29;color:#fff}.out{background:#fff;color:#2B3A33;border:1px solid #D8D0BE}textarea{width:100%;min-height:110px;border:1px solid #D8D0BE;border-radius:12px;padding:12px;font:inherit;box-sizing:border-box}
.pill{align-self:flex-start;padding:4px 12px;border-radius:999px;font-size:13px;font-weight:700}.g{background:#E7F5F9;color:#24573F}.y{background:#FED57D}.r{background:#FDD0D0}</style></head>
<body><main><div class="brand"><i>between</i>colleagues</div><div class="card">${body}</div></main></body></html>`, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
