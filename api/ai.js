// Proxy de IA: las claves viven solo aquí (variables de entorno), nunca en el navegador.
const requireUser = require('./_auth');
const { PROVIDERS, pick } = require('./_providers');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const fail = (status, code, message) => res.status(status).json({ error: { code, message } });
  if (req.method !== 'POST') return fail(405, 'method', 'Usa POST');
  const name = pick();
  if (!name) return fail(500, 'nokey', 'Falta una clave de IA en Vercel (GROQ_API_KEY, GEMINI_API_KEY, ANTHROPIC_API_KEY u OPENAI_API_KEY)');
  const auth = await requireUser(req);
  if (auth.error) return fail(auth.error.status, auth.error.code, auth.error.message);
  let b; try { b = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}; } catch (e) { return fail(400, 'parse', 'JSON no válido'); }
  if (typeof b.prompt !== 'string' || !b.prompt) return fail(400, 'parse', 'Petición vacía');
  if (b.prompt.length > 60000 || (b.image && String(b.image).length > 3500000)) return fail(413, 'parse', 'Petición demasiado grande');
  try {
    const out = await PROVIDERS[name].run({ prompt: b.prompt, image: b.image || null });
    if (!out.text) return fail(502, 'empty_completion', 'Respuesta vacía de ' + name);
    return res.status(200).json({ text: out.text, provider: name });
  } catch (e) {
    return fail(e.status || 502, e.code || 'upstream', '[' + name + '] ' + (e.message || 'error'));
  }
};
