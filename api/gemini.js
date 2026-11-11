// Proxy a Gemini: la clave vive solo aquí (variable de entorno), nunca en el navegador.
const requireUser = require('./_auth');
const MODELS = () => [process.env.GEMINI_MODEL, 'gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash'].filter(Boolean);

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const fail = (status, code, message) => res.status(status).json({ error: { code, message } });
  if (req.method !== 'POST') return fail(405, 'method', 'Usa POST');
  const key = process.env.GEMINI_API_KEY;
  if (!key) return fail(500, 'nokey', 'Falta GEMINI_API_KEY en Vercel');
  const auth = await requireUser(req);
  if (auth.error) return fail(auth.error.status, auth.error.code, auth.error.message);

  const b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  if (!Array.isArray(b.contents) || !b.contents.length) return fail(400, 'parse', 'Petición vacía');
  const payload = JSON.stringify({ contents: b.contents, generationConfig: b.generationConfig || {} });
  if (payload.length > 4000000) return fail(413, 'parse', 'Petición demasiado grande');

  let last = null;
  for (const model of [...new Set(MODELS())]) {
    let r;
    try {
      r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: payload,
      });
    } catch (e) { return fail(502, 'net', 'No llego a Gemini'); }
    const j = await r.json().catch(() => ({}));
    if (r.ok) return res.status(200).json(j);
    const msg = (j.error && j.error.message) || 'HTTP ' + r.status;
    const code = r.status === 429 ? 'quota' : (r.status === 401 || r.status === 403 || /api key/i.test(msg)) ? 'badkey' : (r.status === 404 || /not found|not supported/i.test(msg)) ? 'model' : r.status >= 500 ? 'overloaded' : 'upstream';
    last = { status: r.status === 429 ? 429 : 502, code, message: '[' + model + ' · ' + r.status + '] ' + msg };
    // Se prueba el siguiente modelo si este no existe, está saturado, da error del servidor o rechaza la petición (400)
    if (!['model', 'overloaded', 'upstream'].includes(code)) break;
  }
  return fail(last.status, last.code, last.message);
};
