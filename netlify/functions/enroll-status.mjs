// Estado de pago de la inscripción más reciente de un correo (para activar el curso sin código).
import { listAll, json } from "../lib/admin.mjs";
export default async (req) => {
  const email = String(new URL(req.url).searchParams.get("email") || "").toLowerCase();
  if (!email) return json({ estado: null });
  try {
    const mine = (await listAll("inscripciones")).filter((x) => x.email === email).sort((a, b) => String(b.recibido).localeCompare(String(a.recibido)));
    return json({ estado: mine[0] ? mine[0].estado_pago : null });
  } catch { return json({ estado: null }); }
};
