# Gestor Trabajo - Sistema de Gestión de Empleados

**Gestor Trabajo** es una aplicación de gestión empresarial desarrollada con **Angular 21** y **Tailwind CSS v4**. Proporciona una solución completa para la administración de empleados, localización y planificación de tareas mediante un panel de control moderno e intuitivo.

## 📋 Descripción del Proyecto

Este proyecto está diseñado para facilitar la gestión de recursos humanos y operaciones empresariales, ofreciendo:

* **Gestión de empleados**: Control completo del personal de la empresa
* **Localización**: Seguimiento geográfico de recursos y personal
* **Calendario**: Planificación y seguimiento de eventos y tareas
* **Autenticación**: Sistema seguro de inicio de sesión
* **Dashboard**: Panel de control con información relevante

## 🛠️ Tecnologías Utilizadas

* **Angular 21** - Framework principal
* **TypeScript** - Lenguaje de programación
* **Tailwind CSS v4** - Estilos y diseño responsive
* **FullCalendar** - Gestión de calendario
* **ApexCharts** - Visualización de datos
* **RxJS** - Programación reactiva
* **AmCharts 5** - Visualización avanzada de datos

---

## 🚀 Instalación

### Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

* **Node.js 20.x o superior**
* **Angular CLI** instalado globalmente:

```bash
npm install -g @angular/cli
```

---

### Instalación del Proyecto

1. **Clonar el repositorio** (si aplica)

2. **Instalar dependencias**:

```bash
npm install
```

3. **Iniciar servidor de desarrollo**:

```bash
npm start
```

4. **Abrir en el navegador**:
   
   👉 `http://localhost:4200`

---

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── pages/
│   │   ├── auth-pages/      # Páginas de autenticación
│   │   ├── calender/         # Gestión de calendario
│   │   ├── dashboard/        # Panel principal
│   │   ├── blank/            # Página en blanco
│   │   ├── invoices/         # Gestión de facturas
│   │   └── tables/
│   │       ├── basic-tables/ # Gestión de empleados
│   │       └── localizacion/ # Gestión de localización
│   ├── shared/
│   │   ├── components/       # Componentes reutilizables
│   │   ├── guards/          # Guard de autenticación
│   │   ├── layout/          # Layouts de la aplicación
│   │   ├── services/        # Servicios globales
│   │   └── pipe/            # Pipes personalizadas
│   └── types/               # Definiciones de TypeScript
└── public/                  # Recursos estáticos
    └── images/              # Imágenes del proyecto
```

---

## ⚙️ Funcionalidades Principales

### 🔐 Autenticación
* Sistema de inicio de sesión seguro
* Guard de autenticación para rutas protegidas
* Servicio de autenticación centralizado

### 👥 Gestión de Empleados
* Visualización de listado de empleados en tablas
* Interfaz intuitiva para gestión del personal
* Filtrado y búsqueda de empleados

### 📍 Localización
* Seguimiento geográfico de recursos
* Gestión de ubicaciones del personal
* Mapas interactivos (con soporte de Google Maps)

### 📅 Calendario
* Planificación de eventos y tareas
* Vista de calendario interactiva
* Integración con FullCalendar
* Gestión de eventos con drag & drop

### 🎨 Interfaz de Usuario
* Diseño responsive con Tailwind CSS
* Sidebar navegable con menú colapsable
* Header personalizado
* Sistema de alertas y notificaciones
* Tema personalizable (claro/oscuro)
* Componentes UI reutilizables

---

## 🗺️ Rutas de la Aplicación

### Rutas Protegidas (requieren autenticación)

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/` | Dashboard | Panel de control principal |
| `/calendar` | Calendar | Gestión de calendario y eventos |
| `/empleados` | Basic Tables | Gestión de empleados |
| `/localizacion` | Localización | Gestión de localización |
| `/blank` | Blank Page | Página en blanco |
| `/alerts` | Alerts | Sistema de alertas |

### Rutas Públicas

| Ruta | Componente | Descripción |
|------|-----------|-------------|
| `/signin` | Sign In | Inicio de sesión |
| `/**` | Not Found | Página de error 404 |

---

## 🔧 Servicios Principales

### AuthService
Gestiona la autenticación de usuarios y el control de sesiones.

### ThemeService
Controla el tema de la aplicación (claro/oscuro).

### SidebarService
Gestiona el estado del sidebar (abierto/cerrado).

### ModalService
Controla los modales de la aplicación.

---

## 🎨 Componentes Destacados

* **app-layout**: Layout principal de la aplicación
* **app-header**: Encabezado con navegación y opciones de usuario
* **app-sidebar**: Menú lateral navegable
* **auth-page-layout**: Layout para páginas de autenticación
* **backdrop**: Componente para fondos oscuros de modales

---

## 👨‍💻 Desarrollo

Este proyecto está desarrollado como parte del curso **2DAW (Desarrollo de Aplicaciones Web)** y utiliza las mejores prácticas de Angular y TypeScript.

### Características Técnicas

* ✅ **Standalone Components**: Utiliza la arquitectura de componentes standalone de Angular
* ✅ **Programación Reactiva**: Implementa RxJS para manejo de estados asíncronos
* ✅ **Guards de Ruta**: Protección de rutas con authGuard
* ✅ **Lazy Loading**: Optimización de carga de módulos
* ✅ **Diseño Responsive**: Compatible con dispositivos móviles, tablets y desktop
* ✅ **Type Safety**: Fuertemente tipado con TypeScript

---

## 📦 Dependencias Principales

```json
{
  "@angular/core": "^21.0.6",
  "@angular/router": "^21.0.6",
  "tailwindcss": "^4.1.11",
  "@fullcalendar/angular": "^6.1.20",
  "apexcharts": "^5.3.2",
  "@amcharts/amcharts5": "^5.13.5",
  "rxjs": "~7.8.0"
}
```

---

## 📝 Notas

* Utiliza **Angular 21** con standalone components
* Implementa programación reactiva con **RxJS**
* Diseño **responsive** para múltiples dispositivos
* Compatible con las últimas versiones de navegadores modernos

---

## 📄 Licencia

Este proyecto es un trabajo académico para el curso 2DAW.

---

## 🤝 Contribución

Este es un proyecto académico. Las contribuciones están limitadas al ámbito educativo del curso.

---

## 📧 Contacto

Para consultas relacionadas con el proyecto, contactar a través de los canales del curso 2DAW.
