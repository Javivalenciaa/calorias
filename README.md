# Mis calorías

App web instalable (PWA) para contar calorías con fotos, deporte, balance diario y predicción de peso.
Las claves NO están en la app: viven en variables de entorno de Vercel.

## 1. Supabase (base de datos + login)
1. Crea un proyecto en https://supabase.com.
2. **SQL Editor** → pega el contenido de `schema.sql` → Run.
3. **Authentication → Providers → Email**: desactiva «Confirm email».
4. **Project Settings → API**: copia la *Project URL* y la clave *anon / publishable*.

## 2. IA (elige UNA)
Pon la clave de un proveedor en Vercel; la app usa el primero que encuentre (o el que fijes con `AI_PROVIDER`).

| Proveedor | Variable | Coste | Dónde sacar la clave |
|---|---|---|---|
| **Groq** (recomendado: gratis, rápido, ve fotos) | `GROQ_API_KEY` | gratis | https://console.groq.com/keys |
| Anthropic (Claude Haiku) | `ANTHROPIC_API_KEY` | ~0,002 € por foto | https://console.anthropic.com |
| OpenAI (gpt-4o-mini) | `OPENAI_API_KEY` | ~0,001 € por foto | https://platform.openai.com/api-keys |
| Google Gemini | `GEMINI_API_KEY` | gratis (cuota variable) | https://aistudio.google.com/apikey |

Opcionales: `AI_PROVIDER` (groq / anthropic / openai / gemini), y `GROQ_MODEL`, `ANTHROPIC_MODEL`, `OPENAI_MODEL`, `GEMINI_MODEL` para cambiar el modelo.

## 3. Vercel
Importa este repositorio (Framework: **Other**) y añade en **Settings → Environment Variables**:

| Nombre | Valor |
|---|---|
| `SUPABASE_URL` | Project URL de Supabase |
| `SUPABASE_ANON_KEY` | clave anon / publishable |
| `GROQ_API_KEY` (o la del proveedor elegido) | tu clave de IA |
| `ALLOWED_EMAILS` | (opcional) tu email; solo ese usuario podrá usar la IA |

Después de guardar las variables: **Deployments → ⋯ → Redeploy**.

## 4. Primer uso
Abre la web → **Crear cuenta** (email + contraseña). Luego, en Supabase → Authentication → Sign In / Providers, desactiva «Allow new users to sign up» para que nadie más se registre.
Instálala: iPhone → Safari → Compartir → «Añadir a pantalla de inicio».

## Seguridad
- `/api/ai` exige sesión de Supabase válida (y `ALLOWED_EMAILS` si lo defines): nadie puede gastar tu cuota de IA sin cuenta.
- La clave anon de Supabase es pública por diseño; tus datos los protege RLS (`schema.sql`).
- Nunca pongas la `service_role` ni las claves de IA en el código ni en el navegador.
