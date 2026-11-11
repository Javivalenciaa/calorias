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

  const tried = [], errs = [];
  const call = async (model) => {
    tried.push(model);
    let r;
    try {
      r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body: payload,
      });
    } catch (e) { return { fatal: { status: 502, code: 'net', message: 'No llego a Gemini' } }; }
    const j = await r.json().catch(() => ({}));
    if (r.ok) return { ok: j };
    const msg = (j.error && j.error.message) || 'HTTP ' + r.status;
    const code = r.status === 429 ? 'quota' : (r.status === 401 || r.status === 403 || /api key/i.test(msg)) ? 'badkey' : (r.status === 404 || /not found|not supported/i.test(msg)) ? 'model' : r.status >= 500 ? 'overloaded' : 'upstream';
    errs.push(model + ' → ' + r.status + ' ' + msg.slice(0, 140));
    // Solo se sigue probando si es un problema de este modelo (no existe, saturado, sin cuota —la cuota gratuita es por modelo—, error 5xx o petición rechazada)
    return ['model', 'overloaded', 'upstream', 'quota'].includes(code) ? { retry: true, code } : { fatal: { status: r.status === 429 ? 429 : 502, code, message: msg } };
  };
  const finish = (x) => (x.ok ? res.status(200).json(x.ok) : fail(x.fatal.status, x.fatal.code, x.fatal.message));
  for (const model of [...new Set(MODELS())]) {
    const x = await call(model);
    if (!x.retry) return finish(x);
  }
  // Ningún modelo de la lista sirvió: se pregunta a Gemini qué modelos tiene esta clave y se prueban los mejores.
  try {
    const lr = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=200', { headers: { 'x-goog-api-key': key } });
    const lj = await lr.json().catch(() => ({}));
    const found = (lj.models || [])
      .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map((m) => String(m.name || '').replace(/^models\//, ''))
      .filter((n) => /gemini/.test(n) && /flash/.test(n) && !/embed|tts|image|audio|live|robotics|computer|exp|lite|thinking/.test(n) && !tried.includes(n))
      .sort().reverse().slice(0, 3);
    for (const model of found) { const x = await call(model); if (!x.retry) return finish(x); }
  } catch (e) { /* se informa abajo */ }
  if (errs.length && errs.every((e) => / → 429 /.test(e))) return fail(429, 'quota', errs.join(' | '));
  return fail(502, 'model', 'Ningún modelo respondió. ' + errs.join(' | '));
};
