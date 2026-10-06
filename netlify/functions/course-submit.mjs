// Recibe una propuesta de curso de un instructor y devuelve los enlaces firmados para aprobarla.
import { store, sign, newId, json } from "../lib/cursos.mjs";
const S = (v, n = 4000) => String(v ?? "").slice(0, n);
export default async (req) => {
  if (req.method !== "POST") return json({ error: "method" }, 405);
  try {
    const b = await req.json();
    if (!b.titulo || !b.correo) return json({ error: "Faltan datos" }, 400);
    const id = newId();
    const p = {
      id, estado: "revision", creado: new Date().toISOString(),
      instructor: S(b.instructor, 200), correo: S(b.correo, 200).toLowerCase(), titulo: S(b.titulo, 200), area: S(b.area, 100),
      horas: Number(b.horas) || 6, precio: Number(b.precio) || 0, modalidad: S(b.modalidad, 60), idioma: S(b.idioma, 40),
      cupo: b.cupo ? Number(b.cupo) : null, plataforma: S(b.plataforma, 40), descripcion: S(b.descripcion), objetivos: S(b.objetivos),
      materiales: Array.isArray(b.materiales) ? b.materiales.slice(0, 30).map((m) => ({ tipo: S(m.tipo, 40), titulo: S(m.titulo, 200), desc: S(m.desc, 600) })) : [],
      preguntas: Number(b.preguntas) || 0, historial: [{ f: new Date().toISOString(), t: "Propuesta recibida" }],
    };
    await store().setJSON(id, p);
    const origin = new URL(req.url).origin, base = `${origin}/.netlify/functions/course-review?id=${id}`;
    return json({
      id,
      approveUrl: `${base}&a=approve&t=${sign(id, "approve")}`,
      fixUrl: `${base}&a=fix&t=${sign(id, "fix")}`,
      rejectUrl: `${base}&a=reject&t=${sign(id, "reject")}`,
    });
  } catch (e) {
    return json({ error: String(e.message || e) }, 500);
  }
};
