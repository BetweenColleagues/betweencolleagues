// Entrega al navegador el Client ID (es público) y el entorno. Nunca el secreto.
import { json } from "../lib/paypal.mjs";
export default async () =>
  json({ clientId: process.env.PAYPAL_CLIENT_ID || "", env: process.env.PAYPAL_ENV === "live" ? "live" : "sandbox" });
