// Cobra la orden aprobada y confirma que el pago se completó por el monto correcto.
import { COURSES, API, accessToken, json } from "../lib/paypal.mjs";
import { st, newId } from "../lib/admin.mjs";
export default async (req) => {
  if (req.method !== "POST") return json({ ok: false }, 405);
  try {
    const { orderId, course, email, nombre } = await req.json();
    const c = COURSES[course];
    if (!orderId || !c) return json({ ok: false, error: "datos incompletos" }, 400);
    const token = await accessToken();
    const res = await fetch(`${API()}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    const data = await res.json();
    const cap = data?.purchase_units?.[0]?.payments?.captures?.[0];
    const paid = res.ok && data.status === "COMPLETED" && cap?.status === "COMPLETED"
      && cap.amount?.value === c.price && cap.amount?.currency_code === c.currency;
    if (!paid) return json({ ok: false, error: "pago no completado" }, 402);
    try {
      const id = newId("ins"), now = new Date().toISOString();
      await st("inscripciones").setJSON(id, { id, recibido: now, nombre: String(nombre || "").slice(0, 200), email: String(email || "").toLowerCase().slice(0, 200), curso: c.name, metodo: "PayPal (automático)", monto: `US$${c.price}`, estado_pago: "pagado", orden: data.id, historial: [{ f: now, t: "Pago verificado por PayPal" }] });
    } catch {}
    return json({ ok: true, orderId: data.id, captureId: cap.id });
  } catch (e) {
    return json({ ok: false, error: String(e.message || e) }, 500);
  }
};
