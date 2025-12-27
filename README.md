# TPP - Sistema de Reservas de Pádel

Sistema completo full-stack para gestión de reservas de canchas de pádel.

## Estructura del Proyecto

El proyecto está dividido en dos carpetas principales:

*   **`client/`**: Frontend en React + Vite.
*   **`server/`**: Backend en Node.js + Express + MongoDB.

## Requisitos Previos

*   Node.js (v18+)
*   MongoDB (local o Atlas)
*   Cuenta de Google Cloud (para OAuth)
*   Cuenta de Mercado Pago (para credenciales de prueba)

## Instalación y Configuración

### 1. Variables de Entorno

Crear un archivo `.env` en la carpeta `server/` con el siguiente contenido:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/tpp_padel
CLIENT_URL=http://localhost:5173
JWT_SECRET=tu_secreto_jwt
COOKIE_KEY=tu_secreto_cookie

# Google OAuth
GOOGLE_CLIENT_ID=tu_google_client_id
GOOGLE_CLIENT_SECRET=tu_google_secret

# Mercado Pago
MP_ACCESS_TOKEN=tu_access_token_mp
```

### 2. Instalación de Dependencias

Ejecutar desde la raíz del proyecto para instalar todo:

```bash
# Servidor
cd server
npm install

# Cliente
cd ../client
npm install
```

### 3. Ejecución en Desarrollo

Desde la raíz del proyecto (donde está el `package.json` principal):

```bash
npm run dev
```

Esto iniciará concurrentemente:
*   Backend en `http://localhost:5000`
*   Frontend en `http://localhost:5173`

## Características Implementadas

### Backend
*   **API RESTful** con Express.
*   **Base de Datos**: MongoDB con Mongoose.
*   **Autenticación**: 
    *   Google OAuth 2.0 (Passport.js).
    *   Login con Teléfono + OTP (Simulado para dev).
*   **Reservas**:
    *   Validación de superposición de horarios.
    *   Creación de reservas en estado "pendiente".
    *   **Cron Job**: Cancelación automática de reservas pendientes tras 15 minutos.

### Frontend
*   Arquitectura SPA con React + Vite.
*   **Diseño Responsivo**: Prioridad UX Mobile.
*   **Login Page**: Interfaz moderna para ingreso con Google o Teléfono.
*   **Configuración Proxy**: Redirección automática de `/api` y `/auth` al backend.

## Deployment

### Backend (Render/Railway/Heroku)
1.  Subir la carpeta `server` o el root (configurando el start script).
2.  Configurar las variables de entorno en el panel del proveedor.
3.  Asegurarse de que `CLIENT_URL` apunte al dominio del frontend en producción.

### Frontend (Vercel/Netlify)
1.  Subir la carpeta `client`.
2.  Configurar el comando de build: `npm run build`.
3.  Carpeta de salida: `dist`.
4.  **Importante**: En producción, configurar los rewrites o proxy para que las llamadas a `/api` vayan al dominio del backend.

## Próximos Pasos (Recomendados)

1.  Completar la integración del SDK de Mercado Pago en `bookingController.js`.
2.  Conectar las notificaciones reales (Email/SMS) en los eventos de reserva.
3.  Implementar la lógica final de sincronización con Google Calendar.
