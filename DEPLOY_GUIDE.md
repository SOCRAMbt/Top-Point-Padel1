# 🚀 Guía Definitiva de Despliegue (Production Ready)

Tu aplicación ahora está lista para ir a la nube. Sigue estos pasos para tenerla online y accesible desde cualquier dispositivo (celular, PC, etc) y con todas las integraciones funcionando.

## Paso 1: Subir código a GitHub

1. Ve a [GitHub](https://github.com/new) y crea un **Nuevo Repositorio** (ej: `tpp-booking`).
2. No marques "Initialize with README". Crea un repo vacío.
3. En tu terminal (en la carpeta del proyecto), ejecuta estos comandos (reemplaza `<TU_USUARIO>` y `<TU_REPO>`):

```bash
git remote add origin https://github.com/<TU_USUARIO>/<TU_REPO>.git
git branch -M main
git push -u origin main
```

## Paso 2: Desplegar Backend + Base de Datos (Railway)

Railway es la forma más fácil de tener Node.js y PostgreSQL.

1. Ve a [Railway.app](https://railway.app/) y loguéate con GitHub.
2. Haz clic en **"New Project"** > **"Deploy from GitHub repo"**.
3. Selecciona tu repositorio `tpp-booking`.
4. Railway detectará la carpeta. Tienes que configurar para desplegar la carpeta `server`:
   - En configuración del servicio, ve a **Settings** > **Root Directory** y pon: `/server`.
5. **Base de Datos:**
   - En el dashboard de Railway, haz clic derecho/nuevo > **Database** > **Add PostgreSQL**.
   - Railway creará una DB y automáticamente inyectará la variable `DATABASE_URL` en tu proyecto Node.
6. **Variables de Entorno (Settings > Variables):**
   - `GOOGLE_CLIENT_ID`: (El mismo de tu .env)
   - `GOOGLE_CLIENT_SECRET`: (El mismo de tu .env)
   - `MP_ACCESS_TOKEN`: (El token REAL de producción de Mercado Pago)
   - `CLIENT_URL`: La URL que te dará Vercel (déjalo pendiente un momento o pon `http://localhost:5173` por ahora).
   - `NODE_ENV`: `production`
7. Railway generará un dominio para tu backend (ej: `tpp-server-production.up.railway.app`). **Cópialo.**

## Paso 3: Desplegar Frontend (Vercel)

1. Ve a [Vercel](https://vercel.com/) y loguéate con GitHub.
2. **"Add New..."** > **"Project"** > Importar `tpp-booking`.
3. Vercel detectará el framework "Vite".
4. **IMPORTANTE:** En **"Root Directory"**, haz clic en "Edit" y selecciona la carpeta `client`.
5. **Variables de Entorno:**
   - `VITE_API_URL`: Pega la URL de tu backend en Railway (ej: `https://tpp-server-production.up.railway.app`). **¡Sin la barra al final!**.
6. Haz clic en **Deploy**.
7. Vercel te dará tu URL final (ej: `https://tpp-booking.vercel.app`).

## Paso 4: Conectar Todo

1. **Volver a Railway:**
   - Actualiza la variable `CLIENT_URL` con tu dominio de Vercel (`https://tpp-booking.vercel.app`).
   - Railway redeployará automáticamente.

2. **Google Cloud Console:**
   - Ve a "Credenciales" > Tu Cliente OAuth.
   - En **"Orígenes de JavaScript autorizados"**, agrega tu dominio de Vercel (ej: `https://tpp-booking.vercel.app`).
   - En **"URI de redireccionamiento autorizados"**, agrega la ruta del backend de Railway:
     `https://<TU-RAILWAY-DOMAIN>.up.railway.app/api/auth/google/callback`
   - Y también:
     `https://<TU-RAILWAY-DOMAIN>.up.railway.app/api/auth/google/calendar/callback`

3. **Mercado Pago:**
   - Ahora los Webhooks funcionarán. La URL de notificación será:
     `https://<TU-RAILWAY-DOMAIN>.up.railway.app/api/webhooks/mercadopago`

## ¡Listo! 🎉
Ahora entra a tu URL de Vercel desde tu celular.
- Login con Google: ✅ Funciona.
- Reservar con MP: ✅ Funciona (Confirmación real).
- Calendar Sync: ✅ Funciona.
- Acceso Móvil: ✅ Perfecto.
