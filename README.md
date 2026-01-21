# Gestor Trabajo - Sistema de Gestión de Empleados

**Gestor Trabajo** es una aplicación de gestión empresarial desarrollada con **Angular 18+** y **Tailwind CSS v4** que integra **Supabase** como backend. Proporciona una solución completa para la administración de empleados, localización, vacaciones y tareas mediante un panel de control moderno e intuitivo con autenticación segura.

## 📋 Descripción del Proyecto

Este proyecto es una aplicación full-stack para la gestión de recursos humanos y operaciones empresariales:

### ✨ Características Principales

- **Autenticación Google OAuth2**: Login seguro mediante Google con Supabase (PKCE flow)
- **Gestión de Empleados**: CRUD completo con roles (Administrador/Usuario)
- **Gestión de Localizaciones**: Administración de sedes y ubicaciones con CRUD
- **Sistema de Vacaciones**: Solicitudes de vacaciones con aprobación/rechazo
- **Calendario Interactivo**: Visualización de eventos y tareas
- **Sistema de Notificaciones**: Notificaciones de tareas y solicitudes de vacaciones
- **Row-Level Security (RLS)**: Políticas de seguridad en Supabase para proteger datos
- **Modales de Confirmación**: Confirmación de acciones destructivas (eliminar)
- **Dashboard**: Panel de control con estadísticas
- **Persistencia de Sesión**: localStorage con fallback automático

## 🛠️ Tecnologías Utilizadas

### Frontend
- **Angular 18+** - Framework principal (standalone components)
- **TypeScript** - Lenguaje de programación
- **Tailwind CSS v4** - Estilos y diseño responsive
- **RxJS** - Programación reactiva
- **FormsModule** - Formularios con two-way binding

### Backend
- **Supabase** - PostgreSQL + autenticación + storage
- **Row-Level Security (RLS)** - Políticas de seguridad a nivel de base de datos
- **Google OAuth Provider** - Autenticación federada

### Librerías Adicionales
- **FullCalendar** - Gestión de calendario
- **ApexCharts** - Visualización de datos
- **AmCharts 5** - Gráficos avanzados

---

## 🚀 Instalación y Configuración

### Requisitos Previos

- **Node.js 20.x o superior**
- **Angular CLI 18+**:
  ```bash
  npm install -g @angular/cli
  ```
- **Cuenta de Supabase** (https://supabase.com)
- **Proyecto de Google Cloud** para OAuth2

### Paso 1: Acceder al Proyecto

```bash
cd d:\2DAW\angular
cd Gestor_Trabajo
```

### Paso 2: Instalar Dependencias

```bash
npm install
```

### Paso 3: Configuración de Supabase

#### 3.1 Crear Proyecto en Supabase
1. Ve a https://supabase.com y crea un nuevo proyecto
2. Obtén tu `SUPABASE_URL` y `SUPABASE_ANON_KEY` desde los settings

#### 3.2 Crear Tablas en Supabase (SQL Editor)

```sql
-- Tabla de empleados
CREATE TABLE employees (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'Usuario',
  is_active BOOLEAN DEFAULT true,
  color TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de localizaciones
CREATE TABLE locations (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de solicitudes de vacaciones
CREATE TABLE vacation_requests (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  employee_id BIGINT REFERENCES employees(id),
  employee_email TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de notificaciones
CREATE TABLE notifications (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3.3 Habilitar RLS (Row-Level Security)

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vacation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PARA EMPLOYEES
CREATE POLICY "authenticated_read_all" ON employees
FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_update_all" ON employees
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_delete_all" ON employees
FOR DELETE TO authenticated USING (true);

-- POLÍTICAS PARA LOCATIONS
CREATE POLICY "authenticated_read_locations" ON locations
FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_insert_locations" ON locations
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated_update_locations" ON locations
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_delete_locations" ON locations
FOR DELETE TO authenticated USING (true);

-- POLÍTICAS PARA VACATION_REQUESTS
CREATE POLICY "authenticated_read_vacation_requests" ON vacation_requests
FOR SELECT TO authenticated USING (true);

CREATE POLICY "authenticated_insert_vacation_requests" ON vacation_requests
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated_update_vacation_requests" ON vacation_requests
FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- POLÍTICAS PARA NOTIFICATIONS
CREATE POLICY "authenticated_read_notifications" ON notifications
FOR SELECT TO authenticated
USING (recipient_email = auth.jwt() ->> 'email');

CREATE POLICY "authenticated_insert_notifications" ON notifications
FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "authenticated_update_notifications" ON notifications
FOR UPDATE TO authenticated
USING (recipient_email = auth.jwt() ->> 'email')
WITH CHECK (recipient_email = auth.jwt() ->> 'email');

CREATE POLICY "authenticated_delete_notifications" ON notifications
FOR DELETE TO authenticated
USING (recipient_email = auth.jwt() ->> 'email');
```

#### 3.4 Configurar Google OAuth

1. Ve a **Authentication** → **Providers** en Supabase
2. Habilita **Google**
3. Configura con tus credenciales de Google Cloud
4. Copia la URL de callback que aparece en Supabase

### Paso 4: Configurar Variables de Entorno

Crea o actualiza `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  supabaseUrl: 'TU_SUPABASE_URL',
  supabaseAnonKey: 'TU_SUPABASE_ANON_KEY'
};
```

Crea o actualiza `src/environments/environment.development.ts`:

```typescript
export const environment = {
  production: false,
  supabaseUrl: 'TU_SUPABASE_URL',
  supabaseAnonKey: 'TU_SUPABASE_ANON_KEY'
};
```

### Paso 5: Ejecutar la Aplicación

```bash
npm start
```

La aplicación estará disponible en `http://localhost:4200`

---

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── app.component.ts           # Componente raíz
│   ├── app.routes.ts              # Rutas de la aplicación
│   ├── app.config.ts              # Configuración de la app
│   ├── pages/
│   │   ├── auth-pages/
│   │   │   └── sign-in/           # Página de login con Google
│   │   ├── dashboard/             # Panel de control
│   │   ├── calender/              # Calendario e gestión de vacaciones
│   │   ├── tables/
│   │   │   ├── basic-tables/      # Tabla de empleados con CRUD
│   │   │   └── localizacion/      # Tabla de localizaciones con CRUD
│   │   └── blank/                 # Página en blanco
│   ├── shared/
│   │   ├── components/
│   │   │   ├── header/            # Header con usuario y logout
│   │   │   ├── sidebar/           # Sidebar de navegación
│   │   │   ├── tables/            # Componentes de tablas
│   │   │   └── ui/                # Componentes UI reutilizables
│   │   ├── services/
│   │   │   ├── auth.service.ts    # Autenticación y sesión
│   │   │   ├── employee.service.ts # CRUD de empleados
│   │   │   ├── location.service.ts # CRUD de localizaciones
│   │   │   ├── notification.service.ts # Gestión de notificaciones
│   │   │   ├── supabase.service.ts # Cliente de Supabase
│   │   │   ├── vacation.service.ts # Gestión de vacaciones
│   │   │   ├── modal.service.ts   # Control de modales
│   │   │   ├── theme.service.ts   # Gestión de temas
│   │   │   └── sidebar.service.ts # Estado del sidebar
│   │   ├── guards/
│   │   │   └── auth.guard.ts      # Guard de autenticación async
│   │   ├── pipes/
│   │   │   └── utf8-fix.pipe.ts   # Pipe para UTF-8
│   │   └── layout/
│   │       ├── app-header/        # Layout header
│   │       ├── app-sidebar/       # Layout sidebar
│   │       └── app-layout/        # Layout principal
│   └── types/
│       └── google.d.ts            # Tipos de Google
├── environments/
│   ├── environment.ts
│   └── environment.development.ts
├── styles.css
├── main.ts                        # Punto de entrada
└── index.html
```

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

### Login
1. Abre http://localhost:4200
2. Haz clic en "Sign in with Google"
3. Autoriza el acceso a tu cuenta Google
4. Se redirige automáticamente al dashboard

### Gestión de Empleados
1. Ve a **Tablas** → **Empleados**
2. **Crear**: Haz clic en **Añadir empleado**
3. **Editar**: Haz clic en **Editar** en la fila
4. **Eliminar**: Haz clic en **Borrar** → Confirma en modal
5. **Restricciones**:
   - No puedes cambiar tu propio rol
   - No puedes eliminarte a ti mismo

### Gestión de Localizaciones
1. Ve a **Tablas** → **Localizaciones**
2. **Crear**: Haz clic en **Añadir localización**
3. **Editar**: Modifica en el modal
4. **Eliminar**: Haz clic en **Borrar** → Confirma

### Solicitudes de Vacaciones
1. Ve a **Calendario**
2. Haz clic en **Nueva solicitud**
3. Selecciona fechas y tipo (vacaciones/día libre)
4. **Como usuario**: Tu solicitud va a los administradores
5. **Como admin**: Puedes aprobar o rechazar solicitudes

### Notificaciones
- Verás notificaciones de:
  - Nuevas tareas asignadas
  - Solicitudes de vacaciones pendientes
  - Aprobaciones/rechazos de vacaciones

---

## 🐛 Solución de Problemas

### Error: "RLS policy violation (42501)"
**Causa**: Las políticas RLS no están configuradas correctamente o el usuario no autenticado intenta acceder
**Solución**:
1. Verifica que todas las políticas SQL se hayan ejecutado
2. Asegúrate de que el usuario está autenticado
3. Revisa que recipient_email coincida con el email del usuario

### Error: "Session not restoring on refresh"
**Causa**: El servicio de autenticación no tiene suficiente tiempo para restaurar
**Solución**:
- AuthGuard espera 500ms
- AuthService espera 1.5s en handleAuthCallback()
- restoreUser() usa Promise.race() con timeout de 2s

### Error: "Could not find column"
**Causa**: La tabla no tiene esa columna en Supabase
**Solución**: Verifica que todas las tablas SQL se hayan creado correctamente y con los nombres exactos

### Error: "Email is not verified"
**Causa**: En Google OAuth, el email debe ser verificado
**Solución**: Supabase verifica automáticamente; si hay problema, recrea el usuario en Google

---

## 📊 Estado Actual del Proyecto

### ✅ Completado
- [x] Autenticación Google OAuth2 con PKCE flow
- [x] Detección de tokens en URL (detectSessionInUrl)
- [x] Restauración de sesión en localStorage
- [x] Gestión CRUD de empleados con validaciones
- [x] Gestión CRUD de localizaciones con confirmación
- [x] Sistema de vacaciones (solicitar/aprobar/rechazar)
- [x] Calendario interactivo con FullCalendar
- [x] Notificaciones (lectura, envío, RLS)
- [x] RLS en todas las tablas de Supabase
- [x] Modales de confirmación para eliminar
- [x] Restricción de edición de rol para usuario actual
- [x] Prevención de auto-eliminación de empleados
- [x] Dashboard con estadísticas
- [x] Persistencia de sesión en localStorage con fallback
- [x] AuthGuard async con delay para restauración

### 🔄 En Desarrollo
- [ ] Reportes avanzados
- [ ] Exportación de datos (PDF/Excel)
- [ ] Integración con email para notificaciones

### 📋 Características Futuras
- [ ] Gestión de permisos granulares
- [ ] Auditoría de cambios en base de datos
- [ ] Búsqueda avanzada en tablas
- [ ] Filtros personalizados
- [ ] Histórico de acciones de usuario

---

## 🔍 Debugging

### Console Logs Útiles
Los servicios registran información en la consola para debugging:

```typescript
// AuthService
[AuthService] Restaurando usuario...
[AuthService] Usuario restaurado: email@example.com

// EmployeeService
[EmployeeService] Empleados cargados: 5

// LocationService
[LocationTable] Ubicaciones cargadas: 3
```

### Verificar RLS en Supabase
1. Ve a SQL Editor en Supabase
2. Ejecuta:
```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

---

## 📞 Soporte

Para obtener ayuda:
- Revisa la documentación de [Supabase](https://supabase.com/docs)
- Consulta la documentación de [Angular](https://angular.dev)
- Verifica los logs en la consola del navegador (F12)
- Revisa los logs de Supabase en el dashboard

---

## 📄 Licencia

Este proyecto está bajo licencia MIT.

---

**Última actualización**: Enero 2026
**Versión**: 1.0.0
**Estado**: En desarrollo activo
**Autor**: Desarrollador 2DAW

### Cambios Recientes (v1.0.0)
- ✨ Integración completa con Supabase
- 🔐 Row-Level Security en todas las tablas
- 🔑 Autenticación Google OAuth2 con PKCE
- 📱 Diseño responsive con Tailwind CSS v4
- 🎯 Modales de confirmación para acciones destructivas
- 📧 Sistema de notificaciones
- 📅 Gestión de vacaciones con aprobación
