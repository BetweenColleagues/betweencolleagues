// Utilidades compartidas para hablar con PayPal desde el servidor.
// Variables de entorno (Netlify > Project configuration > Environment variables):
//   PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_ENV = "sandbox" | "live"

// Catálogo de cursos: el precio SIEMPRE se define aquí, en el servidor,
// para que nadie pueda cambiarlo desde el navegador.
export const COURSES = {
  "educacion-trauma": { name: "Curso: Educación informada en trauma", price: "34.00", currency: "USD" },
};

export const API = () =>
  (process.env.PAYPAL_ENV === "live") ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

export async function accessToken() {
  const id = process.env.PAYPAL_CLIENT_ID, secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error("Faltan PAYPAL_CLIENT_ID o PAYPAL_CLIENT_SECRET");
  const res = await fetch(`${API()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error("No se pudo autenticar con PayPal");
  return (await res.json()).access_token;
}

export const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
