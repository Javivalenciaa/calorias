# Mis calorías (web app instalable)

App para contar calorías con fotos (Gemini), deporte, balance por días y predicción de peso.
Es una web estática: no necesita servidor ni compilar nada.

## 1. Clave gratis de Gemini
1. Entra en https://aistudio.google.com/apikey con tu cuenta de Google.
2. «Crear clave de API» y cópiala. **No la subas a ningún sitio**: la pegarás dentro de la app.

## 2. Publicarla (elige una)

### Opción A · Vercel (recomendada)
1. Crea una cuenta en https://github.com y un repositorio nuevo (privado vale).
2. «Add file → Upload files» y sube TODOS los archivos de esta carpeta (index.html, sw.js, manifest.webmanifest, vercel.json, los iconos .png).
3. En https://vercel.com entra con GitHub → «Add New… → Project» → elige ese repositorio.
4. Framework: «Other». No toques nada más (sin comando de build, sin carpeta de salida). Pulsa «Deploy».
5. Te dará una dirección tipo `https://tu-proyecto.vercel.app`.

### Opción B · Netlify Drop (si tienes ordenador)
Arrastra esta carpeta a https://app.netlify.com/drop.

### Opción C · Cloudflare Pages
«Workers & Pages → Create → Pages → Upload assets» y sube los archivos.

## 3. Ponerla en la pantalla de inicio
- iPhone: abre la dirección en **Safari** → botón Compartir → «Añadir a pantalla de inicio».
- Android: Chrome → menú ⋮ → «Instalar app».
Ábrela desde el icono: se ve a pantalla completa y funciona sin conexión (la IA sí necesita internet).

## 4. Conectar la IA
En la app: **Ajustes → Inteligencia artificial** → pega la clave → «Guardar y probar».
Si el modelo por defecto (`gemini-flash-latest`) no existiera, el botón te propone uno válido de tu cuenta.

## 5. Guardar los datos en la nube (Supabase, opcional y gratis)
Así tus comidas, entrenos y pesajes de cada día quedan guardados y la IA los usa en los informes.
1. Crea un proyecto en https://supabase.com (plan Free).
2. **SQL Editor** → pega el SQL que aparece en la app (Ajustes → Sincronización → «Copiar SQL») → Run.
3. **Authentication → Providers → Email**: desactiva «Confirm email».
4. **Project Settings → API**: copia la *Project URL* y la clave *anon / publishable*.
5. En la app: **Ajustes → Sincronización** → pega URL y clave, escribe un email y una contraseña → «Crear cuenta».
6. Después de crear tu cuenta, en Authentication → Sign In / Providers desactiva «Allow new users to sign up» para que nadie más pueda registrarse.
En otro móvil: mismos datos y «Iniciar sesión». La clave anon es pública por diseño; tus datos los protege la política RLS del SQL.

## 6. Informe con IA
**Progreso → Informe con IA** (7, 14 o 30 días): Gemini lee tu historial y te dice cómo vas.

## Notas
- Tus datos se guardan en el propio móvil (no hay servidor). Usa **Ajustes → Copia de seguridad** de vez en cuando.
- Las fotos solo se envían a Google cuando pulsas «Analizar con IA».
- En el plan gratuito de Gemini hay límites por minuto/día y Google puede usar lo enviado para mejorar sus productos.
- Si actualizas los archivos en GitHub, Vercel republica solo; cierra y reabre la app para ver la versión nueva.
