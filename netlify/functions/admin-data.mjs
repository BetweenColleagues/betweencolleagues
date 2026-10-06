import { isAdmin, listAll, json } from "../lib/admin.mjs";
import { syncForms } from "../lib/forms.mjs";
export default async (req) => {
  if (!isAdmin(req)) return json({ ok: false }, 401);
  try {
    let sync = { synced: false };
    try { sync = await syncForms(); } catch (e) { sync = { synced: false, error: String(e.message || e) }; }
    const [solicitudes, inscripciones, reportes, propuestas] = await Promise.all(["solicitudes", "inscripciones", "reportes", "propuestas"].map(listAll));
    return json({ ok: true, sync, solicitudes, inscripciones, reportes, propuestas });
  } catch (e) { return json({ ok: false, error: String(e.message || e) }, 500); }
};
