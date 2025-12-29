# 🎾 Top Point Padel - Sistema de Reservas

> Sistema integral para la gestión de reservas de canchas de pádel, con pagos online y sincronización automática de calendario.

![Project Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![Stack](https://img.shields.io/badge/Stack-MERN-blue)

## 📖 Descripción

**TPP Booking System** es una aplicación web moderna diseñada para simplificar el proceso de alquilar canchas. Permite a los usuarios registrarse, seleccionar horarios disponibles en tiempo real, pagar mediante Mercado Pago (o efectivo) y recibir automáticamente la reserva en su Google Calendar.

El sistema está diseñado con una arquitectura robusta que soporta tanto entornos de desarrollo local (con mocks inteligentes) como despliegues en la nube de alta disponibilidad.

## ✨ Funcionalidades Principales (Hecho)

*   **Autenticación Híbrida:** Login con **Google OAuth** y **OTP (Código SMS)** vía número de teléfono.
*   **Gestión de Reservas:** Visualización de horarios disponibles en tiempo real. Prevención de conflictos de reservas.
*   **Integración de Pagos:** Conexión completa con **Mercado Pago** (Checkout Pro).
*   **Google Calendar Sync:** Las reservas confirmadas se agendan automáticamente en el calendario del usuario.
*   **Responsive Design:** Interfaz optimizada para móviles y escritorio usando **Tailwind CSS**.
*   **Base de Datos Inteligente:**
    *   **Local:** SQLite (Cero configuración).
    *   **Producción:** PostgreSQL (Activación automática).
*   **Modo Desarrollo Smart:**
    *   Mock de SMS (Código fijo `123456`).
    *   Auto-confirmación de pagos simulados para probar flujo completo sin webhooks locales.

## 🛠️ Stack Tecnológico

### Frontend (Client)
*   **Framework:** React + Vite
*   **Estilos:** Tailwind CSS
*   **HTTP Client:** Axios
*   **State Mgmt:** React Query

### Backend (Server)
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **ORM:** Sequelize (Soporte Multi-DB)
*   **Integraciones:** `googleapis`, `mercadopago`, `twilio` (simulado).

---

## 📂 Arquitectura y Estructura de Archivos

El proyecto utiliza una estructura **Monorepo** separada en `client` y `server`.

### 📁 Raíz
*   `DEPLOY_GUIDE.md`: Guía paso a paso para subir a producción (Vercel/Railway).
*   `INSTRUCCIONES_GOOGLE_CALENDAR.md`: Guía para configurar Google Cloud Console.

### 📁 client (Frontend)
```text
client/
├── src/
│   ├── components/    # Componentes UI reutilizables (Botones, Modales, Inputs)
│   ├── pages/         # Vistas principales (Home, BookingWizard, Profile)
│   ├── services/      # Lógica de conexión con API (api.js endpoints)
│   └── App.jsx        # Configuración de Routing
├── index.html         # Punto de entrada
└── vite.config.js     # Configuración del bundler y Proxy
```

### 📁 server (Backend)
```text
server/
├── src/
│   ├── config/        # Configuración de DB, Passport, Variables
│   ├── controllers/   # Lógica de negocio (AuthController, ReservationController)
│   ├── models/        # Definiciones de Tablas (User, Reservation, Payment)
│   ├── routes/        # Definición de endpoints API (/api/auth, /api/booking)
│   └── services/      # Lógica externa (GoogleCalendarService, PaymentService)
├── server.js          # Punto de entrada del servidor
└── tpp_v3.sqlite      # Base de datos local (ignorada en git)
```

---

## 🚀 Cómo Correr en Local (Localhost)

1.  **Instalar dependencias:**
    ```bash
    cd client && npm install
    cd ../server && npm install
    ```

2.  **Configurar Variables de Entorno:**
    *   Crea un archivo `.env` en `server/` basándote en los ejemplos.

3.  **Iniciar Servidores:**
    *   Abre dos terminales:
    *   Terminal 1 (Backend): `cd server && npm start`
    *   Terminal 2 (Frontend): `cd client && npm run dev`

4.  **Acceder:**
    *   PC: `http://localhost:5173`
    *   Móvil (misma red): `http://TU_IP_LOCAL:5173` (Login con OTP `123456`).

---

## ☁️ Cómo Desplegar  (Producción)

Para llevar la app a internet real (con HTTPS, Webhooks de Mercado Pago funcionales y Auth de Google sin restricciones), sigue la guía detallada:

👉 **[VER GUÍA DE DESPLIEGUE (DEPLOY_GUIDE.md)](./DEPLOY_GUIDE.md)**

Resumen:
1.  **Backend:** Desplegar en **Railway** (automáticamente usará PostgreSQL).
2.  **Frontend:** Desplegar en **Vercel**.
3.  **Config:** Actualizar URLs en Google Cloud y Mercado Pago.

---

## ✅ Estado del Proyecto

| Módulo | Estado | Notas |
| :--- | :---: | :--- |
| **Frontend UI** | ✅ Completado | Diseño moderno y responsive. |
| **Auth (Google)** | ✅ Completado | Requiere HTTPS para móvil. |
| **Auth (OTP)** | ✅ Completado | Simulado en Dev, listo para Twilio en Prod. |
| **Reservas** | ✅ Completado | Validación de solapamiento y horarios. |
| **Pagos (MP)** | ✅ Completado | Webhook listo. Mock auto-confirm en local. |
| **Calendar Sync**| ✅ Completado | Token refresh y reconexión robusta. |
| **Admin Panel** | 🚧 Pendiente | Funcionalidad básica, requiere analytics avanzados. |

---

**Desarrollado con ❤️ para Top Point Padel.**
