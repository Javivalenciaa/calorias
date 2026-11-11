# Mis calorías

App web instalable (PWA) para contar calorías con fotos, deporte, balance diario y predicción de peso.
Las claves NO están en la app: viven en variables de entorno de Vercel.

## 1. Supabase (base de datos + login)
1. Crea un proyecto en https://supabase.com.
2. **SQL Editor** → pega el contenido de `schema.sql` → Run.
3. **Authentication → Providers → Email**: desactiva «Confirm email».
4. **Project Settings → API**: copia la *Project URL* y la clave *anon / publishable*.

## 2. Gemini
Crea una clave gratis en https://aistudio.google.com/apikey.

## 3. Vercel
Importa este repositorio (Framework: **Other**) y añade en **Settings → Environment Variables**:

| Nombre | Valor |
|---|---|
| `SUPABASE_URL` | Project URL de Supabase |
| `SUPABASE_ANON_KEY` | clave anon / publishable |
| `GEMINI_API_KEY` | tu clave de Gemini |
| `ALLOWED_EMAILS` | (opcional) tu email; solo ese usuario podrá usar la IA |
| `GEMINI_MODEL` | (opcional) modelo, por defecto `gemini-flash-latest` |

Después de guardar las variables: **Deployments → ⋯ → Redeploy**.

## 4. Primer uso
Abre la web → **Crear cuenta** (email + contraseña). Luego, en Supabase → Authentication → Sign In / Providers, desactiva «Allow new users to sign up» para que nadie más se registre.
Instálala: iPhone → Safari → Compartir → «Añadir a pantalla de inicio».

## Seguridad
- `/api/gemini` exige sesión de Supabase válida (y `ALLOWED_EMAILS` si lo defines): nadie puede gastar tu cuota de Gemini sin cuenta.
- La clave anon de Supabase es pública por diseño; tus datos los protege RLS (`schema.sql`).
- Nunca pongas la `service_role` ni la clave de Gemini en el código ni en el navegador.
