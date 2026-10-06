import { checkPassword, makeToken, json } from "../lib/admin.mjs";
export default async (req) => {
  if (req.method !== "POST") return json({ ok: false }, 405);
  try {
    const { email, password } = await req.json();
    await new Promise((r) => setTimeout(r, 400)); // frena intentos repetidos
    if (!checkPassword(email, password)) return json({ ok: false }, 401);
    return json({ ok: true, token: makeToken() });
  } catch (e) { return json({ ok: false, error: String(e.message || e) }, 500); }
};
