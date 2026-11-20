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

## Cómo aprende de ti (modelo bayesiano)
La app lleva un **filtro de Kalman** (todo en tu móvil, gratis, sin servidor) que cada día estima a la vez:
- **Tu gasto real** (kcal/día): parte de la fórmula y de los datos de Salud y se corrige con cada día registrado y cada pesada. Incluye tu metabolismo, tu actividad y lo que se escapa al registrar, así que tus objetivos se ajustan solos.
- **Tu peso real sin agua** y el agua que va y viene.
- **Qué mueve tu báscula**: hidratos y comida del día anterior, el gimnasio, pesarte sin ayunar, el sueño y cenar tarde. Lo aprende de tus datos, con su margen de error.
- **Cuánto acierta**: predice cada pesada antes de verla (y cada lunes, la de la semana siguiente) y te enseña el error real.

Con eso: objetivo diario que sigue tu gasto aprendido y compensa los excesos de los últimos 6 días (con límites; se puede desactivar en Ajustes), predicción de tu peso de mañana, previsión a 16 semanas con bandas de probabilidad y la fecha probable de tu meta.
**Para que aprenda rápido: pésate cada mañana en ayunas y registra todo lo que comes.**

## Chef y coach
Botón **+ → Chef y coach** (o «Pregúntale al chef» en Hoy). Guarda tu nevera (escribiendo o con una foto), conoce lo que te queda hoy, tu gasto real y lo que sueles comer, y te propone comidas con gramos exactos que añades a tu día con un toque. También responde dudas sobre tu peso con los datos del modelo. En Ajustes puedes poner tus gustos y alergias.

## Cerebro del gimnasio
- **Entreno de hoy** (en Hoy): elige los músculos que más series te faltan esta semana y que ya están recuperados, tus ejercicios habituales primero, y te pone la carga de la progresión doble. Un toque en «Empezar» y se rellena el entreno. «Otra opción» genera otra combinación.
- **Tu fuerza** (en Progreso): 1RM estimado de cada ejercicio, ritmo de mejora aprendido con un modelo bayesiano, estancamientos (y cambio automático por una variante), nivel frente a tu peso y previsión a 8 semanas.
- **Recuperación por músculo**, **series semanales con sinergias** y **cuánto músculo puedes ganar ahora** con lo que te frena (frecuencia, proteína, déficit, sueño).
- El **coach** del chat ve todo esto y puede proponerte rutinas que empiezas con un toque.

## Seguridad
- `/api/ai` exige sesión de Supabase válida (y `ALLOWED_EMAILS` si lo defines): nadie puede gastar tu cuota de IA sin cuenta.
- La clave anon de Supabase es pública por diseño; tus datos los protege RLS (`schema.sql`).
- Nunca pongas la `service_role` ni las claves de IA en el código ni en el navegador.
