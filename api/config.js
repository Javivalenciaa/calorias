// Valores PÚBLICOS para el navegador (la clave anon de Supabase es pública por diseño).
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({
    supabaseUrl: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    ai: !!require('./_providers').pick(),
  });
};
