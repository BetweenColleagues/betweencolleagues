// Lista pública de cursos aceptados para el catálogo.
import { store, json } from "../lib/cursos.mjs";
export default async () => {
  try {
    const s = store(), { blobs } = await s.list(), out = [];
    for (const b of blobs) {
      const p = await s.get(b.key, { type: "json" });
      if (p && p.estado === "aprobado")
        out.push({ id: p.id, titulo: p.titulo, instructor: p.instructor, area: p.area, horas: p.horas, precio: p.precio, modalidad: p.modalidad, idioma: p.idioma, cupo: p.cupo, descripcion: p.descripcion, publicado: p.publicado });
    }
    out.sort((a, b) => String(b.publicado).localeCompare(String(a.publicado)));
    return new Response(JSON.stringify(out), { headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=60" } });
  } catch (e) {
    return json([], 200);
  }
};
