// Comprueba que la petición viene de un usuario de Supabase (y, si se define, de un email permitido).
module.exports = async function requireUser(req) {
  const url = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
  const anon = process.env.SUPABASE_ANON_KEY || '';
  if (!url || !anon) return { error: { status: 500, code: 'config', message: 'Faltan SUPABASE_URL o SUPABASE_ANON_KEY en Vercel' } };
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!token) return { error: { status: 401, code: 'auth', message: 'Sin sesión' } };
  let r;
  try { r = await fetch(url + '/auth/v1/user', { headers: { apikey: anon, Authorization: 'Bearer ' + token } }); }
  catch (e) { return { error: { status: 502, code: 'net', message: 'No llego a Supabase' } }; }
  if (!r.ok) return { error: { status: 401, code: 'auth', message: 'Sesión no válida' } };
  const user = await r.json();
  const allowed = (process.env.ALLOWED_EMAILS || '').split(',').map((x) => x.trim().toLowerCase()).filter(Boolean);
  if (allowed.length && !allowed.includes(String(user.email || '').toLowerCase())) return { error: { status: 403, code: 'auth', message: 'Email no autorizado' } };
  return { user };
};
