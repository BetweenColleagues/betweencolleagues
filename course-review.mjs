// Página a la que llevan los enlaces del correo: muestra la propuesta y, al confirmar, la publica,
// pide corrección o la rechaza. (Se confirma con un botón para que los filtros del correo no la aprueben solos.)
import { store, verify, page, esc } from "../lib/cursos.mjs";
const LABEL = { approve: "Aceptar y publicar", fix: "Pedir corrección", reject: "No aprobar" };
const STATE = { approve: "aprobado", fix: "correccion", reject: "rechazado" };
export default async (req) => {
  const u = new URL(req.url);
  let id = u.searchParams.get("id"), a = u.searchParams.get("a"), t = u.searchParams.get("t"), msg = "";
  if (req.method === "POST") {
    const f = await req.formData(); id = f.get("id"); a = f.get("a"); t = f.get("t"); msg = String(f.get("m") || "").slice(0, 2000);
  }
  if (!id || !LABEL[a] || !verify(id, a, t)) return page("Enlace no válido", "<h1>Enlace no válido</h1><p>Este enlace no es válido o está incompleto.</p>");
  const s = store(), p = await s.get(id, { type: "json" });
  if (!p) return page("No encontrado", "<h1>Propuesta no encontrada</h1>");
  const info = `<dl><dt>Curso</dt><dd>${esc(p.titulo)}</dd><dt>Instructor</dt><dd>${esc(p.instructor)} · ${esc(p.correo)}</dd><dt>Área</dt><dd>${esc(p.area)}</dd><dt>Duración</dt><dd>${esc(p.horas)} horas · ${esc(p.materiales.length)} materiales · ${esc(p.preguntas)} preguntas</dd><dt>Precio</dt><dd>RD$${esc(p.precio)}</dd><dt>Modalidad</dt><dd>${esc(p.modalidad)} · ${esc(p.idioma)}</dd><dt>Descripción</dt><dd>${esc(p.descripcion)}</dd></dl>`;
  if (req.method !== "POST") {
    const needMsg = a !== "approve";
    return page(LABEL[a], `<h1>${LABEL[a]}</h1><span class="pill y">Estado actual: ${esc(p.estado)}</span>${info}
      <form method="POST"><input type="hidden" name="id" value="${esc(id)}"><input type="hidden" name="a" value="${esc(a)}"><input type="hidden" name="t" value="${esc(t)}">
      ${needMsg ? '<p><label for="m"><strong>Mensaje para el instructor</strong></label></p><textarea id="m" name="m" required></textarea>' : ""}
      <p style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px"><button class="${a === "approve" ? "ok" : a === "reject" ? "red" : "out"}" type="submit">Confirmar: ${LABEL[a]}</button></p></form>`);
  }
  p.estado = STATE[a];
  p.historial.push({ f: new Date().toISOString(), t: LABEL[a], m: msg || undefined });
  if (a === "approve") p.publicado = new Date().toISOString();
  if (msg) p.mensaje = msg;
  await s.setJSON(id, p);
  const first = String(p.instructor || "").split(" ")[0] || "";
  const subj = a === "approve" ? "¡Tu curso fue ACEPTADO! · betweencolleagues" : a === "fix" ? "Tu curso necesita un ajuste · betweencolleagues" : "Sobre tu propuesta de curso · betweencolleagues";
  const body = a === "approve"
    ? `Hola ${first}:\n\nTu curso "${p.titulo}" fue aceptado y ya aparece publicado en betweencolleagues.com.\n\nDesde tu panel de instructor puedes definir la fecha, la hora y el cupo.\n\n¡Gracias por compartir tu experiencia!\n\nChristina Rosado Valdés\nbetweencolleagues`
    : `Hola ${first}:\n\nRevisamos tu curso "${p.titulo}".\n\n${msg}\n\nChristina Rosado Valdés\nbetweencolleagues`;
  const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(p.correo)}&su=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
  const origin = u.origin;
  return page("Listo", `<span class="pill ${a === "approve" ? "g" : a === "fix" ? "y" : "r"}">${a === "approve" ? "Publicado" : a === "fix" ? "Corrección pedida" : "No aprobado"}</span>
    <h1>${a === "approve" ? "Curso aceptado y publicado" : a === "fix" ? "Se pidió una corrección" : "El curso no fue aprobado"}</h1>
    <p>${a === "approve" ? "El curso ya aparece en el catálogo de betweencolleagues.com y el instructor lo ve como aceptado en su panel." : "El instructor verá tu mensaje en su panel."}</p>
    <p style="display:flex;gap:10px;flex-wrap:wrap"><a class="btn ok" href="${gmail}" target="_blank" rel="noopener">Avisar al instructor por correo</a><a class="btn out" href="${origin}/#inicio">Ver la página</a></p>`);
};
