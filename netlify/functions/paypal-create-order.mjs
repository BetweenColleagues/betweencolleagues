// Crea la orden de pago con el precio del catálogo del servidor.
import { COURSES, API, accessToken, json } from "../lib/paypal.mjs";
export default async (req) => {
  if (req.method !== "POST") return json({ error: "method" }, 405);
  try {
    const { course } = await req.json();
    const c = COURSES[course];
    if (!c) return json({ error: "curso desconocido" }, 400);
    const token = await accessToken();
    const res = await fetch(`${API()}/v2/checkout/orders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{ reference_id: course, description: c.name, amount: { currency_code: c.currency, value: c.price } }],
      }),
    });
    const order = await res.json();
    if (!res.ok) return json({ error: "paypal", details: order.name || "" }, 502);
    return json({ id: order.id });
  } catch (e) {
    return json({ error: String(e.message || e) }, 500);
  }
};
