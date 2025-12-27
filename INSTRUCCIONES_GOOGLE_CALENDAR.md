# 📅 Guía de Configuración: Integración con Google Calendar

Para que el sistema pueda agendar automáticamente las reservas en el calendario de Google del usuario, es necesario configurar las credenciales de la API de Google.

## Paso 1: Crear Credenciales en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com/).
2. Crea un **Nuevo Proyecto** (ej: "TPP Booking System").
3. En el menú lateral, ve a **APIs y Servicios > Biblioteca**.
4. Busca **"Google Calendar API"** y haz clic en **Habilitar**.
5. Ve a **APIs y Servicios > Pantalla de consentimiento de OAuth**.
   - Selecciona **Externo**.
   - Llena los datos básicos (Nombre de la App, emails).
   - En **Permisos (Scopes)**, agrega:
     - `.../auth/calendar.events` (Ver, editar, compartir y eliminar permanentemente todos los calendarios).
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`
   - Agrega tu correo en "Usuarios de prueba".
6. Ve a **APIs y Servicios > Credenciales**.
7. Haz clic en **Crear credenciales > ID de cliente de OAuth**.
   - Tipo de aplicación: **Aplicación web**.
   - Nombre: "TPP Web Client".
   - **Orígenes de JavaScript autorizados**:
     - `http://localhost:5173`
   - **URI de redireccionamiento autorizados**:
     - `http://localhost:5050/api/auth/google/callback`
     - `http://localhost:5050/api/auth/google/calendar/callback`
8. Copia el **ID de cliente** y el **Secreto de cliente**.

## Paso 2: Configurar el Sistema

1. Abre el archivo `server/.env` en tu proyecto.
2. Pega las credenciales que copiaste en los campos correspondientes (reemplaza los valores actuales):

```env
GOOGLE_CLIENT_ID=tu_cliente_id_aqui
GOOGLE_CLIENT_SECRET=tu_secreto_cliente_aqui
```

3. Reinicia el servidor backend (`node server.js`).

## Paso 3: Activar en la Aplicación

1. Inicia sesión en la aplicación TPP.
2. Ve a tu perfil (haz clic en tu nombre o icono de usuario).
3. Busca la opción **"Sincronizar reservas con Google Calendar"**.
4. Activa el interruptor (Switch).
5. Se abrirá una ventana de Google pidiendo permisos. Acepta.
6. ¡Listo! A partir de ahora, cada vez que confirmes una reserva, se creará automáticamente un evento en tu calendario.

---

**Nota:** Como la app está en modo de prueba en Google, es posible que veas una advertencia de "Google no ha verificado esta aplicación". Haz clic en "Avanzado" -> "Ir a TPP (inseguro)" para continuar.
