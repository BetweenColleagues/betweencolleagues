// Estado de las propuestas de un instructor (para "Mis cursos").
import { store, json } from "../lib/cursos.mjs";
export default async (req) => {
  const email = String(new URL(req.url).searchParams.get("email") || "").toLowerCase();
  if (!email) return json([]);
  try {
    const s = store(), { blobs } = await s.list(), out = [];
    for (const b of blobs) {
      const p = await s.get(b.key, { type: "json" });
      if (p && p.correo === email) out.push({ id: p.id, titulo: p.titulo, estado: p.estado, mensaje: p.mensaje || "" });
    }
    return json(out);
  } catch (e) {
    return json([]);
  }
};
