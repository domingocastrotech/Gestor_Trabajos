# Gestor Trabajo - Sistema Integral de Gestión Empresarial

![Angular](https://img.shields.io/badge/Angular-21.0.6-red?logo=angular)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-38bdf8?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-2.90-3ecf8e?logo=supabase)

**Gestor Trabajo** es una aplicación empresarial full-stack desarrollada con **Angular 21** y **Tailwind CSS v4**, utilizando **Supabase** como backend. Proporciona una solución completa para la administración de recursos humanos, gestión de ubicaciones, solicitudes de vacaciones, notificaciones en tiempo real y más.

## 📋 Descripción del Proyecto

Sistema integral de gestión empresarial que combina autenticación segura, gestión de personal, control de vacaciones y notificaciones en tiempo real con una interfaz moderna y responsive.

### ✨ Características Principales

#### 🔐 Autenticación y Seguridad
- **Google OAuth2** con PKCE flow a través de Supabase
- **Callback automático** con detección de tokens en URL
- **Row-Level Security (RLS)** en todas las tablas de base de datos
- **Persistencia de sesión** en localStorage con restauración automática
- **Guards de navegación** para proteger rutas privadas

#### 👥 Gestión de Empleados
- CRUD completo con validaciones
- Sistema de roles (Administrador/Usuario)
- Asignación de colores para identificación visual
- Prevención de auto-eliminación y auto-modificación de roles
- Estados activo/inactivo

#### 🏢 Gestión de Localizaciones
- CRUD de ubicaciones empresariales
- Información de dirección, ciudad y más
- Modales de confirmación para operaciones destructivas
- Integración con empleados

#### 📅 Sistema de Vacaciones y Días Libres
- Solicitudes de vacaciones y días libres
- Flujo de aprobación/rechazo por administradores
- Calendario visual con FullCalendar
- **Notificaciones por correo** (vía Supabase Edge Functions con Resend)
- Comentarios en aprobaciones/rechazos
- Historial de decisiones con timestamps

#### 🔔 Sistema de Notificaciones
- Notificaciones en tiempo real
- Filtrado por usuario con RLS
- Marcado de leídas/no leídas
- Soporte para datos JSON personalizados
- Vista centralizada de todas las notificaciones

#### 🎨 UI/UX Moderna
- **Dashboard** con estadísticas y gráficos (ApexCharts, AmCharts)
- **Tema claro/oscuro** con persistencia
- **Sidebar colapsable** y responsive
- **Modales reutilizables** para CRUD y confirmaciones
- **Componentes standalone** de Angular 21
- Diseño completamente responsive con Tailwind CSS v4

#### ⚡ Funcionalidades Técnicas
- **Supabase Edge Functions** para envío de correos
- **Pipes personalizados** (UTF-8 fix, safe HTML)
- **Servicios modulares** para cada entidad
- **Manejo robusto de errores**
- **Logs detallados** para debugging

## 🛠️ Stack Tecnológico

### Frontend
| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| **Angular** | 21.0.6 | Framework principal (standalone components) |
| **TypeScript** | 5.x | Lenguaje tipado |
| **Tailwind CSS** | 4.1.11 | Framework CSS utility-first |
| **RxJS** | 7.8 | Programación reactiva |
| **Angular Router** | 21.0.6 | Navegación y routing |
| **Angular Forms** | 21.0.6 | Formularios reactivos y template-driven |

### Backend & Base de Datos
| Tecnología | Propósito |
|-----------|-----------|
| **Supabase** | Backend as a Service (PostgreSQL + Auth + Storage + Edge Functions) |
| **PostgreSQL** | Base de datos relacional |
| **Row-Level Security** | Seguridad a nivel de fila en BD |
| **Supabase Auth** | Sistema de autenticación OAuth2 |
| **Supabase Edge Functions** | Funciones serverless (Deno runtime) |
| **Resend API** | Servicio de envío de correos transaccionales |

### Librerías y Componentes
| Librería | Versión | Uso |
|----------|---------|-----|
| **FullCalendar** | 6.1.20 | Calendario interactivo |
| **ApexCharts** | 5.3.2 | Gráficos y visualizaciones |
| **AmCharts 5** | 5.13.5 | Mapas y gráficos avanzados |
| **Flatpickr** | 4.6.13 | Selector de fechas |
| **PrismJS** | 1.30.0 | Resaltado de sintaxis |
| **Swiper** | 11.2.10 | Carruseles y sliders |
| **Popper.js** | 2.11.8 | Posicionamiento de tooltips |

---

## 🚀 Instalación y Configuración

### Requisitos Previos

- **Node.js** v20.x o superior
- **npm** v10.x o superior
- **Angular CLI** v21.x:
  ```bash
  npm install -g @angular/cli@21
  ```
- **Cuenta de Supabase** ([crear cuenta](https://supabase.com))
- **Cuenta de Google Cloud** para OAuth2 ([console](https://console.cloud.google.com))
- **Cuenta de Resend** para correos (opcional, [crear cuenta](https://resend.com))

---

### 📦 Paso 1: Clonar e Instalar

```bash
# Navegar al directorio
cd d:\2DAW\angular\Gestor_Trabajo

# Instalar dependencias
npm install
```

---

### 🗄️ Paso 2: Configurar Supabase

#### 2.1 Crear Proyecto
1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Crea un nuevo proyecto
3. Guarda la **URL del proyecto** y **anon key**

#### 2.2 Crear Estructura de Base de Datos

Ejecuta los siguientes scripts SQL en el **SQL Editor** de Supabase:

<details>
<summary><b>📋 Script: Tabla de Empleados</b></summary>

```sql
CREATE TABLE employees (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'Usuario' CHECK (role IN ('Administrador', 'Usuario')),
  is_active BOOLEAN DEFAULT true,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para búsquedas por email
CREATE INDEX idx_employees_email ON employees(email);
```
</details>

<details>
<summary><b>📋 Script: Tabla de Localizaciones</b></summary>

```sql
CREATE TABLE locations (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```
</details>

<details>
<summary><b>📋 Script: Tabla de Solicitudes de Vacaciones</b></summary>

```sql
CREATE TABLE vacation_requests (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  type TEXT NOT NULL CHECK (type IN ('vacation', 'day-off')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reason TEXT,
  decided_by_employee_id BIGINT REFERENCES employees(id) ON DELETE SET NULL,
  decided_at TIMESTAMP WITH TIME ZONE,
  request_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar consultas
CREATE INDEX idx_vacation_employee ON vacation_requests(employee_id);
CREATE INDEX idx_vacation_status ON vacation_requests(status);
CREATE INDEX idx_vacation_dates ON vacation_requests(start_date, end_date);
```
</details>

<details>
<summary><b>📋 Script: Tabla de Notificaciones</b></summary>

```sql
CREATE TABLE notifications (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índice para filtrar por destinatario
CREATE INDEX idx_notifications_recipient ON notifications(recipient_email);
CREATE INDEX idx_notifications_read ON notifications(read);
```
</details>

#### 2.3 Configurar Row-Level Security (RLS)

<details>
<summary><b>🔒 Script: Políticas RLS</b></summary>

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS: EMPLOYEES
CREATE POLICY "auth_read_employees" ON employees
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_insert_employees" ON employees
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_update_employees" ON employees
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_delete_employees" ON employees
  FOR DELETE TO authenticated USING (true);

-- POLÍTICAS: LOCATIONS
CREATE POLICY "auth_read_locations" ON locations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_insert_locations" ON locations
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_update_locations" ON locations
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_delete_locations" ON locations
  FOR DELETE TO authenticated USING (true);

-- POLÍTICAS: VACATION_REQUESTS
CREATE POLICY "auth_read_vacation_requests" ON vacation_requests
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "auth_insert_vacation_requests" ON vacation_requests
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "auth_update_vacation_requests" ON vacation_requests
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "auth_delete_vacation_requests" ON vacation_requests
  FOR DELETE TO authenticated USING (true);

-- POLÍTICAS: NOTIFICATIONS (Solo lee sus propias notificaciones)
CREATE POLICY "user_read_own_notifications" ON notifications
  FOR SELECT TO authenticated
  USING (recipient_email = auth.jwt() ->> 'email');

CREATE POLICY "auth_insert_notifications" ON notifications
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "user_update_own_notifications" ON notifications
  FOR UPDATE TO authenticated
  USING (recipient_email = auth.jwt() ->> 'email')
  WITH CHECK (recipient_email = auth.jwt() ->> 'email');

CREATE POLICY "user_delete_own_notifications" ON notifications
  FOR DELETE TO authenticated
  USING (recipient_email = auth.jwt() ->> 'email');
```
</details>

---

### 🔐 Paso 3: Configurar Google OAuth2

#### 3.1 Configurar en Google Cloud Console

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea o selecciona un proyecto
3. Habilita la **Google+ API**
4. Ve a **Credenciales** → **Crear credenciales** → **ID de cliente de OAuth 2.0**
5. Configura la pantalla de consentimiento:
   - Tipo: **Externo**
   - Alcances: `email`, `profile`, `openid`
6. Crea las credenciales:
   - Tipo: **Aplicación web**
   - URIs de redirección autorizados:
     ```
     https://TU_PROYECTO_ID.supabase.co/auth/v1/callback
     ```
7. Copia el **Client ID** y **Client Secret**

#### 3.2 Configurar en Supabase Dashboard

1. Ve a **Authentication** → **Providers** en Supabase
2. Busca y habilita **Google**
3. Pega el **Client ID** y **Client Secret**
4. Guarda los cambios

> 📖 **Documentación detallada**: Ver [.AUTENTICACION_SUPABASE.md](.AUTENTICACION_SUPABASE.md)

---

### ⚙️ Paso 4: Variables de Entorno

Configura los archivos de entorno con tus credenciales:

**`src/environments/environment.development.ts`:**
```typescript
export const environment = {
  production: false,
  supabaseUrl: 'https://TU_PROYECTO.supabase.co',
  supabaseKey: 'TU_ANON_KEY',
  appUrl: 'http://localhost:4200'
};
```

**`src/environments/environment.ts`:**
```typescript
export const environment = {
  production: true,
  supabaseUrl: 'https://TU_PROYECTO.supabase.co',
  supabaseKey: 'TU_ANON_KEY',
  appUrl: 'https://tu-dominio.com'
};
```

---

### 📧 Paso 5: Configurar Edge Function para Correos (Opcional)

Si deseas habilitar notificaciones por email:

1. **Crea cuenta en [Resend](https://resend.com)** y obtén tu API Key
2. **Configura el secreto en Supabase**:
   ```bash
   supabase secrets set RESEND_API_KEY=re_xxxxxxxxxx
   ```
3. **Despliega la función**:
   ```bash
   supabase functions deploy Mail-send-vacations
   ```

> 📁 Código de la función: `supabase/functions/Mail-send-vacations/index.ts`

---

### ▶️ Paso 6: Ejecutar la Aplicación

```bash
# Modo desarrollo
npm start

# O específicamente
ng serve
```

La aplicación estará disponible en: **http://localhost:4200**

---

### 🏗️ Paso 7: Compilar para Producción

```bash
# Build
npm run build

# Los archivos se generan en dist/
```

---

## 📁 Estructura del Proyecto

```
Gestor_Trabajo/
├── 📄 Configuration Files
│   ├── angular.json              # Configuración de Angular CLI
│   ├── package.json              # Dependencias y scripts
│   ├── tsconfig.json             # Configuración TypeScript
│   ├── tsconfig.app.json         # TS config para app
│   ├── tsconfig.spec.json        # TS config para tests
│   └── .postcssrc.json           # Configuración PostCSS/Tailwind
│
├── 📂 public/                    # Assets estáticos
│   └── images/                   # Imágenes (brand, icons, logos, etc.)
│
├── 📂 supabase/                  # Backend serverless
│   └── functions/
│       └── Mail-send-vacations/  # Edge Function para envío de emails
│           └── index.ts          # Función Deno para Resend API
│
└── 📂 src/                       # Código fuente
    ├── index.html                # HTML principal
    ├── main.ts                   # Punto de entrada de la app
    ├── styles.css                # Estilos globales (Tailwind)
    │
    ├── 📂 environments/          # Variables de entorno
    │   ├── environment.ts        # Producción
    │   └── environment.development.ts  # Desarrollo
    │
    └── 📂 app/                   # Aplicación Angular
        ├── app.component.*       # Componente raíz
        ├── app.config.ts         # Configuración de la app
        ├── app.routes.ts         # Definición de rutas
        │
        ├── 📂 types/             # Definiciones de tipos TypeScript
        │   └── google.d.ts       # Tipos para Google OAuth
        │
        ├── 📂 pages/             # Páginas de la aplicación
        │   ├── 📂 auth-pages/    # Páginas de autenticación
        │   │   ├── sign-in/      # Login con Google
        │   │   └── auth-callback/ # Callback OAuth
        │   │
        │   ├── 📂 dashboard/     # Panel de control (vacío actualmente)
        │   ├── 📂 calender/      # Calendario de vacaciones
        │   ├── 📂 notifications/ # Vista de notificaciones
        │   ├── 📂 blank/         # Página en blanco
        │   │
        │   ├── 📂 tables/        # Tablas de datos
        │   │   ├── basic-tables/ # Tabla de empleados con CRUD
        │   │   └── localizacion/ # Tabla de ubicaciones con CRUD
        │   │
        │   ├── 📂 ui-elements/   # Elementos de UI
        │   │   └── alerts/       # Componente de alertas
        │   │
        │   └── 📂 other-page/    # Páginas especiales
        │       ├── not-found/    # Error 404
        │       └── unauthorized/ # Error 401
        │
        └── 📂 shared/            # Recursos compartidos
            ├── 📂 services/      # Servicios de negocio
            │   ├── auth.service.ts         # Autenticación y sesión
            │   ├── supabase.service.ts     # Cliente Supabase
            │   ├── employee.service.ts     # CRUD empleados
            │   ├── location.service.ts     # CRUD localizaciones
            │   ├── vacation.service.ts     # Gestión de vacaciones
            │   ├── notification.service.ts # Sistema de notificaciones
            │   ├── task.service.ts         # Gestión de tareas
            │   ├── modal.service.ts        # Control de modales
            │   ├── theme.service.ts        # Tema claro/oscuro
            │   └── sidebar.service.ts      # Estado del sidebar
            │
            ├── 📂 guards/        # Guards de navegación
            │   └── auth.guard.ts # Protección de rutas privadas
            │
            ├── 📂 pipes/         # Pipes personalizados
            │   ├── safe-html.pipe.ts  # Sanitización HTML
            │   └── utf8-fix.pipe.ts   # Corrección UTF-8
            │
            ├── 📂 layout/        # Componentes de layout
            │   ├── app-layout/   # Layout principal
            │   ├── app-header/   # Header de la app
            │   ├── app-sidebar/  # Sidebar de navegación
            │   ├── auth-page-layout/  # Layout para páginas de auth
            │   └── backdrop/     # Fondo oscuro para modales
            │
            └── 📂 components/    # Componentes reutilizables
                ├── 📂 auth/      # Componentes de autenticación
                │   ├── signin-form/  # Formulario de login
                │   └── signup-form/  # Formulario de registro
                │
                ├── 📂 common/    # Componentes comunes
                │   ├── countdown-timer/    # Temporizador
                │   └── theme-toggle/       # Botón tema claro/oscuro
                │
                ├── 📂 header/    # Componentes del header
                │   └── user-dropdown/  # Dropdown de usuario
                │
                ├── 📂 tables/    # Componentes de tablas
                │   └── [varios componentes de tabla]
                │
                └── 📂 ui/        # Componentes UI genéricos
                    └── videos/   # Reproductores de video
```

> 📘 **Para documentación detallada de cada carpeta y archivo, consulta**: [`.saberdelproyecto.md`](.saberdelproyecto.md)

---

## 🔐 Autenticación y Seguridad

### Flujo de Autenticación OAuth2 (PKCE)

1. **Usuario abre la app** → AuthGuard verifica si hay sesión
2. **Sin sesión** → Se redirige a `/signin`
3. **Usuario hace clic en "Sign in with Google"** → Se abre ventana de Google
4. **Google devuelve token en URL** → `detectSessionInUrl: true` lo captura
5. **AuthService.handleAuthCallback()** → Espera 1.5s para procesamiento
6. **getSession()** → Obtiene datos de usuario de Supabase
7. **restoreUser()** → Carga employee data desde BD
8. **AuthGuard permite acceso** → Se redirige a dashboard

### Row-Level Security (RLS)

Las políticas RLS garantizan:

- ✅ Cada usuario solo ve sus propias notificaciones
- ✅ Todos pueden leer empleados y localizaciones
- ✅ Empleados no pueden eliminarse a sí mismos
- ✅ Solo el propietario puede modificar sus notificaciones
- ✅ Protección a nivel de base de datos (no depende del cliente)

---

## 📝 Guía de Uso

### 🔐 Autenticación

1. **Abrir la aplicación**: http://localhost:4200
2. **Hacer login**: Clic en "Sign in with Google"
3. **Autorizar**: Permite el acceso a tu cuenta Google
4. **Redirección automática**: Serás redirigido al dashboard

> La sesión se guarda en `localStorage` y se restaura automáticamente.

---

### 👥 Gestión de Empleados

**Ubicación**: Menú → **Tablas** → **Empleados**

#### Acciones Disponibles

| Acción | Descripción | Restricciones |
|--------|-------------|---------------|
| **Crear** | Clic en botón "Añadir empleado" | Requiere: nombre, email, rol |
| **Editar** | Clic en icono de edición en fila | No puedes cambiar tu propio rol |
| **Eliminar** | Clic en icono de borrar | No puedes eliminarte a ti mismo |
| **Ver** | Tabla con información completa | Todos los usuarios |

#### Campos
- **Nombre**: Nombre completo del empleado
- **Email**: Correo electrónico (único)
- **Rol**: Administrador o Usuario
- **Estado**: Activo o Inactivo
- **Color**: Color de identificación visual

---

### 🏢 Gestión de Localizaciones

**Ubicación**: Menú → **Tablas** → **Localizaciones**

#### Acciones
- ✅ **Crear**: Modal con formulario (nombre, dirección, ciudad)
- ✏️ **Editar**: Modificar cualquier campo
- 🗑️ **Eliminar**: Confirmación mediante modal
- 👁️ **Visualizar**: Lista completa de ubicaciones

#### Validaciones
- Todos los campos son obligatorios
- Modal de confirmación para eliminaciones

---

### 📅 Sistema de Vacaciones

**Ubicación**: Menú → **Calendario**

#### Para Usuarios Normales

1. **Crear Solicitud**:
   - Clic en "Nueva solicitud"
   - Seleccionar tipo: **Vacaciones** o **Día libre**
   - Elegir fechas (inicio y fin)
   - Añadir motivo (opcional)
   - Enviar solicitud

2. **Ver Estado**:
   - Pendiente: ⏳ Amarillo
   - Aprobada: ✅ Verde
   - Rechazada: ❌ Rojo

#### Para Administradores

1. **Ver Solicitudes Pendientes**:
   - Lista de todas las solicitudes en estado "pendiente"
   - Información del empleado y fechas

2. **Aprobar Solicitud**:
   - Clic en botón "Aprobar"
   - Añadir comentario (opcional)
   - Se envía email al empleado (si está configurado)

3. **Rechazar Solicitud**:
   - Clic en botón "Rechazar"
   - Añadir motivo (recomendado)
   - Se envía email al empleado

#### Notificaciones por Email
- 📧 El empleado recibe un correo cuando su solicitud es aprobada/rechazada
- Incluye fechas, tipo de solicitud y comentarios del administrador
- Requiere configuración de Supabase Edge Function + Resend

---

### 🔔 Notificaciones

**Ubicación**: Menú → **Notificaciones**

#### Tipos de Notificaciones
- 📋 **Tareas**: Nuevas tareas asignadas
- 🏖️ **Vacaciones**: Solicitudes pendientes, aprobadas o rechazadas
- ⚠️ **Alertas**: Notificaciones del sistema

#### Gestión
- **Marcar como leída**: Clic en la notificación
- **Ver todas**: Historial completo
- **Filtrado automático**: Solo ves tus propias notificaciones (RLS)

---

### 🎨 Personalización

#### Cambiar Tema
- **Ubicación**: Icono en el header
- **Opciones**: Claro / Oscuro
- **Persistencia**: Se guarda la preferencia

#### Sidebar
- **Colapsar/Expandir**: Clic en icono de menú
- **Navegación**: Menú lateral con todas las secciones
- **Responsive**: Se adapta a móviles y tablets

---

## 🐛 Solución de Problemas

### Error: "RLS policy violation (42501)"

**Síntomas**: No se pueden leer/escribir datos de la base de datos

**Causas**:
- Las políticas RLS no están configuradas
- El usuario no está autenticado
- El email del JWT no coincide con `recipient_email`

**Solución**:
```sql
-- 1. Verificar que RLS está habilitado
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- 2. Verificar políticas existentes
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';

-- 3. Si faltan políticas, ejecutar los scripts de configuración del Paso 2
```

---

### Error: "Session not found" al recargar

**Síntomas**: La sesión se pierde al refrescar la página

**Causas**:
- `localStorage` bloqueado por el navegador
- El token expiró
- No se dio tiempo suficiente para restaurar

**Solución**:
1. Verifica que `localStorage` esté habilitado
2. El `AuthGuard` espera 500ms antes de verificar sesión
3. `handleAuthCallback()` espera 1.5s para procesar tokens
4. Si persiste, limpia `localStorage` y vuelve a hacer login:
   ```javascript
   localStorage.clear();
   ```

---

### Error: "Cannot find module 'https://deno.land/...'"

**Síntomas**: Error de TypeScript con imports de Deno

**Causa**: TypeScript está intentando compilar archivos de Supabase Edge Functions

**Solución**: Ya está resuelto en `tsconfig.json`:
```json
{
  "exclude": ["supabase/**"]
}
```

---

### Error: "Email domain not verified" (Resend)

**Síntomas**: Los correos no se envían o se rechazan

**Causa**: Resend requiere dominio verificado (o usar su dominio de prueba)

**Solución temporal**:
- En desarrollo, los correos solo se envían a emails verificados
- Usa el email de prueba de Resend: `onboarding@resend.dev`
- Para producción: [configura tu dominio en Resend](https://resend.com/domains)

---

### Error: Usuarios no pueden ver su información

**Síntomas**: El empleado no aparece en la base de datos después de login

**Causa**: El usuario se autenticó pero no existe en la tabla `employees`

**Solución**: Crear manualmente el empleado en Supabase:
```sql
INSERT INTO employees (name, email, role, is_active)
VALUES ('Nombre Usuario', 'email@example.com', 'Usuario', true);
```

---

### Error: "JWT malformed" o "Invalid token"

**Síntomas**: Errores de autenticación constantes

**Causa**: Token corrupto en localStorage

**Solución**:
```javascript
// Ejecutar en consola del navegador
localStorage.removeItem('supabase.auth.token');
localStorage.clear();
// Luego recargar la página y hacer login de nuevo
```

---

### Problema: Estilos de Tailwind no se aplican

**Síntomas**: Los estilos CSS no funcionan o se ven rotos

**Causa**: PostCSS/Tailwind no está compilando correctamente

**Solución**:
```bash
# Limpiar caché de Angular
rm -rf .angular/cache

# Reinstalar node_modules
rm -rf node_modules package-lock.json
npm install

# Reiniciar servidor
npm start
```

---

### Logs de Debugging

Los servicios registran información útil en la consola:

```typescript
// AuthService
[AuthService] Restaurando usuario...
[AuthService] Usuario restaurado: user@example.com

// EmployeeService
[EmployeeService] Empleados cargados: 5
[EmployeeService] Error: RLS violation

// VacationService
[VacationService] Solicitud aprobada: ID 123
[VacationService] Enviando email a: user@example.com

// NotificationService
[NotificationService] Notificaciones cargadas: 3
```

**Cómo ver logs**:
1. Abrir DevTools (F12)
2. Ir a la pestaña **Console**
3. Filtrar por nombre del servicio (ej: `[AuthService]`)

---

### Verificar Estado de Supabase

```sql
-- Ver todos los empleados
SELECT * FROM employees;

-- Ver solicitudes de vacaciones
SELECT * FROM vacation_requests
ORDER BY created_at DESC;

-- Ver notificaciones por usuario
SELECT * FROM notifications
WHERE recipient_email = 'tu_email@example.com';

-- Verificar sesiones activas (tabla auth.users)
SELECT email, created_at, last_sign_in_at
FROM auth.users;
```

---

## 📊 Estado del Proyecto

### ✅ Funcionalidades Implementadas

#### Autenticación y Seguridad
- [x] Google OAuth2 con Supabase (PKCE flow)
- [x] Detección automática de tokens en URL
- [x] Restauración de sesión desde localStorage
- [x] AuthGuard con delay para prevenir race conditions
- [x] Row-Level Security en todas las tablas
- [x] Políticas RLS personalizadas por tabla
- [x] Logout y limpieza de sesión

#### Gestión de Empleados
- [x] CRUD completo (Create, Read, Update, Delete)
- [x] Sistema de roles (Administrador/Usuario)
- [x] Validación de campos (email único, nombre requerido)
- [x] Prevención de auto-eliminación
- [x] Restricción de cambio de rol propio
- [x] Estados activo/inactivo
- [x] Asignación de colores de identificación
- [x] Tabla interactiva con búsqueda y filtrado

#### Gestión de Localizaciones
- [x] CRUD completo con modal
- [x] Campos: nombre, dirección, ciudad
- [x] Modal de confirmación para eliminación
- [x] Validaciones de campos requeridos
- [x] Tabla responsive

#### Sistema de Vacaciones
- [x] Solicitud de vacaciones (múltiples días)
- [x] Solicitud de día libre (1 día)
- [x] Estados: pendiente, aprobada, rechazada
- [x] Aprobación/Rechazo por administradores
- [x] Comentarios en decisiones
- [x] Calendario visual con FullCalendar
- [x] Historial de solicitudes
- [x] Notificación por email (con Resend API)
- [x] Template HTML responsive para emails

#### Sistema de Notificaciones
- [x] Creación de notificaciones
- [x] Lectura y marcado como leídas
- [x] RLS: cada usuario solo ve sus notificaciones
- [x] Tipos: tareas, vacaciones, alertas
- [x] Datos JSON personalizados
- [x] Vista de lista ordenada por fecha

#### UI/UX
- [x] Tema claro/oscuro con persistencia
- [x] Sidebar colapsable
- [x] Header con dropdown de usuario
- [x] Modales reutilizables
- [x] Diseño responsive (móvil, tablet, desktop)
- [x] Componentes standalone de Angular 21
- [x] Tailwind CSS v4 para estilos
- [x] Animaciones y transiciones

#### Infraestructura
- [x] Supabase Edge Function para correos
- [x] Integración con Resend API
- [x] Variables de entorno por ambiente
- [x] Configuración de TypeScript optimizada
- [x] Build de producción configurado

---

### 🔄 En Desarrollo

- [ ] Dashboard con estadísticas reales
  - Gráficos de empleados activos vs inactivos
  - Estadísticas de solicitudes de vacaciones
  - Timeline de eventos recientes

- [ ] Sistema de tareas avanzado
  - Asignación de tareas a empleados
  - Prioridades y estados
  - Fechas de vencimiento

- [ ] Reportes y exportación
  - Exportar a PDF
  - Exportar a Excel
  - Reportes personalizados

---

### 📋 Roadmap Futuro

#### Corto Plazo (1-2 meses)
- [ ] **Búsqueda avanzada** en tablas
  - Filtros múltiples
  - Ordenamiento por columnas
  - Paginación mejorada

- [ ] **Gestión de permisos granulares**
  - Roles personalizados
  - Permisos por módulo
  - Restricciones por ubicación

- [ ] **Mejoras en vacaciones**
  - Días disponibles por empleado
  - Política de vacaciones configurable
  - Aprobaciones en cadena

#### Medio Plazo (3-6 meses)
- [ ] **Módulo de asistencia**
  - Check-in/check-out
  - Registro de horas trabajadas
  - Reporte de asistencia

- [ ] **Sistema de evaluación de desempeño**
  - KPIs por empleado
  - Evaluaciones periódicas
  - Feedback 360°

- [ ] **Chat interno**
  - Mensajería entre empleados
  - Canales por proyecto/departamento
  - Notificaciones en tiempo real

#### Largo Plazo (6-12 meses)
- [ ] **Integración con nómina**
  - Cálculo de salarios
  - Deducciones y bonos
  - Reportes fiscales

- [ ] **App móvil nativa**
  - iOS y Android
  - Notificaciones push
  - Modo offline

- [ ] **Inteligencia artificial**
  - Predicción de necesidades de personal
  - Sugerencias de asignación de tareas
  - Análisis de tendencias

---

### 🎯 Objetivos de Calidad

- [x] **Código limpio**: Servicios modulares y reutilizables
- [x] **Seguridad**: RLS en base de datos
- [x] **Performance**: Carga rápida con lazy loading
- [ ] **Tests unitarios**: >80% cobertura
- [ ] **Tests E2E**: Flujos críticos cubiertos
- [ ] **Documentación**: Completa y actualizada
- [ ] **CI/CD**: Pipeline automatizado

---

## 🔍 Debugging y Monitoreo

### Console Logs del Sistema

Cada servicio emite logs detallados para facilitar el debugging:

#### AuthService
```
[AuthService] Restaurando usuario desde localStorage...
[AuthService] Usuario restaurado exitosamente: user@example.com
[AuthService] Error en restauración: No session found
[AuthService] Login con Google iniciado
[AuthService] Callback procesado, redirigiendo...
```

#### EmployeeService
```
[EmployeeService] Cargando empleados...
[EmployeeService] Empleados cargados: 5
[EmployeeService] Creando empleado: Juan Pérez
[EmployeeService] Error en getAll(): RLS policy violation
```

#### VacationService
```
[VacationService] getAll() - Consultando vacation_requests...
[VacationService] Usuario autenticado: user@example.com ID: abc123
[VacationService] Es admin? true
[VacationService] Cantidad de registros devueltos: 8
[VacationService] Enviando notificación de decisión para request: 15
[VacationService] Respuesta de función: { status: 200, data: {...} }
```

#### NotificationService
```
[NotificationService] Cargando notificaciones para: user@example.com
[NotificationService] Notificaciones cargadas: 3
[NotificationService] Marcando notificación como leída: 42
```

### Herramientas de Debugging

#### Browser DevTools
```bash
# Abrir DevTools
F12 (Windows/Linux)
Cmd + Option + I (Mac)

# Pestaña Console: Ver logs
# Pestaña Network: Ver llamadas a Supabase
# Pestaña Application: Ver localStorage
```

#### Inspeccionar localStorage
```javascript
// Ver toda la sesión
console.log(localStorage);

// Ver token de Supabase
console.log(localStorage.getItem('supabase.auth.token'));

// Limpiar sesión
localStorage.clear();
```

#### Verificar Estado de la Aplicación
```javascript
// En consola del navegador
// Ver usuario actual
console.log('User:', JSON.parse(localStorage.getItem('currentUser')));

// Ver tema actual
console.log('Theme:', localStorage.getItem('theme'));
```

### Queries SQL Útiles para Debugging

```sql
-- Ver todos los empleados
SELECT id, name, email, role, is_active
FROM employees
ORDER BY created_at DESC;

-- Ver solicitudes pendientes
SELECT vr.*, e.name as employee_name
FROM vacation_requests vr
JOIN employees e ON vr.employee_id = e.id
WHERE vr.status = 'pending'
ORDER BY vr.request_date DESC;

-- Ver últimas notificaciones
SELECT * FROM notifications
ORDER BY created_at DESC
LIMIT 20;

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'public';

-- Ver usuarios autenticados (Supabase Auth)
SELECT id, email, created_at, last_sign_in_at, email_confirmed_at
FROM auth.users
ORDER BY created_at DESC;

-- Estadísticas rápidas
SELECT
  (SELECT COUNT(*) FROM employees WHERE is_active = true) as empleados_activos,
  (SELECT COUNT(*) FROM vacation_requests WHERE status = 'pending') as solicitudes_pendientes,
  (SELECT COUNT(*) FROM notifications WHERE read = false) as notificaciones_sin_leer;
```

---

## 📞 Recursos y Soporte

### Documentación Oficial

| Recurso | URL | Propósito |
|---------|-----|-----------|
| **Angular** | https://angular.dev | Framework frontend |
| **Supabase** | https://supabase.com/docs | Backend y base de datos |
| **Tailwind CSS** | https://tailwindcss.com/docs | Framework de estilos |
| **FullCalendar** | https://fullcalendar.io/docs | Calendario |
| **Resend** | https://resend.com/docs | Servicio de emails |
| **TypeScript** | https://www.typescriptlang.org/docs | Lenguaje |

### Documentación del Proyecto

- 📘 **Estructura detallada**: [.saberdelproyecto.md](.saberdelproyecto.md)
- 🔐 **Configuración de autenticación**: [.AUTENTICACION_SUPABASE.md](.AUTENTICACION_SUPABASE.md)
- 📋 **Este archivo**: [README.md](README.md)

### Comandos Útiles

```bash
# Desarrollo
npm start                    # Iniciar servidor de desarrollo
npm run build                # Build de producción
npm run watch                # Build incremental
ng generate component <name> # Generar componente
ng generate service <name>   # Generar servicio

# Supabase (si tienes CLI instalado)
supabase start              # Iniciar Supabase local
supabase db reset           # Resetear base de datos local
supabase functions deploy   # Desplegar edge functions
supabase gen types typescript # Generar tipos TypeScript

# Git
git status                  # Ver cambios
git add .                   # Añadir todos los cambios
git commit -m "mensaje"     # Commit
git push                    # Subir cambios
```

### Contacto y Ayuda

Para obtener ayuda:
1. Revisa la documentación interna del proyecto
2. Consulta los logs en la consola (F12)
3. Verifica el estado de Supabase Dashboard
4. Revisa los issues conocidos en este README

---

## 📄 Licencia

Este proyecto está bajo licencia **MIT**.

```
MIT License

Copyright (c) 2026 Gestor Trabajo

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🎓 Créditos

**Desarrollador**: Estudiante 2DAW
**Institución**: 2º Desarrollo de Aplicaciones Web
**Año**: 2026
**Versión**: 1.0.2
**Estado**: ✅ En desarrollo activo

---

### 📝 Changelog

#### v1.0.2 (Enero 2026) - Actual
- ✨ Sistema completo de vacaciones con emails
- ✨ Supabase Edge Function para envío de correos (Resend)
- ✨ Templates HTML responsive para emails
- 🔒 Row-Level Security en todas las tablas
- 🐛 Fix: Exclusión de carpeta supabase en tsconfig
- 📚 Documentación completa actualizada

#### v1.0.1 (Enero 2026)
- ✨ Gestión de localizaciones con CRUD
- ✨ Modales de confirmación para eliminaciones
- 🎨 Mejoras en UI con Tailwind CSS v4
- 🔐 Restricciones de auto-edición en empleados

#### v1.0.0 (Enero 2026)
- 🎉 Lanzamiento inicial
- ✨ Autenticación Google OAuth2
- ✨ Gestión de empleados
- ✨ Sistema de notificaciones
- ✨ Calendario básico
- 🔒 Implementación de RLS

---

**⭐ Si te resulta útil este proyecto, no olvides darle una estrella!**

---

**Última actualización**: Enero 2026
**Próxima revisión**: Febrero 2026
