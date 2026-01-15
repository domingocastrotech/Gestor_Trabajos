import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { AuthService } from '../../shared/services/auth.service';
import { Utf8FixPipe } from '../../shared/pipes/utf8-fix.pipe';
import { Router } from '@angular/router';

interface Task {
  id: string;
  title: string;
  location: string;
  dueDate: string;
  employeeName: string;
  employeeColor: string;
  startTime: string;
  endTime: string;
}

interface Activity {
  id: number;
  action: string;
  description: string;
  date: string;
  icon: string;
}

interface Employee {
  id: number;
  name: string;
  email: string;
  avatar: string;
  rol: string;
}

interface Location {
  id: number;
  name: string;
  city: string;
}

@Component({
  selector: 'app-blank',
  imports: [PageBreadcrumbComponent, CommonModule, Utf8FixPipe],
  templateUrl: './blank.component.html',
  styles: ``
})
export class BlankComponent implements OnInit {
  currentEmployee: any;

  taskStats = {
    total: 0,
    todayTasks: 0,
    thisWeekTasks: 0,
    pendingVacations: 0
  };

  employees: Employee[] = [
    {
      id: 1,
      name: 'Ana García',
      email: 'ana.garcia@empresa.com',
      avatar: '/images/user/user-01.png',
      rol: 'Administrador'
    },
    {
      id: 2,
      name: 'Luis Pérez',
      email: 'luis.perez@empresa.com',
      avatar: '/images/user/user-02.png',
      rol: 'Usuario'
    },
    {
      id: 3,
      name: 'María López',
      email: 'maria.lopez@empresa.com',
      avatar: '/images/user/user-03.png',
      rol: 'Usuario'
    }
  ];

  locations: Location[] = [
    { id: 1, name: 'Sede Central', city: 'Madrid' },
    { id: 2, name: 'Oficina Norte', city: 'Bilbao' },
    { id: 3, name: 'Centro Operativo', city: 'Barcelona' }
  ];

  upcomingTasks: Task[] = [];

  recentActivities: Activity[] = [];

  weeklyStats = [
    { day: 'Lun', tasks: 0 },
    { day: 'Mar', tasks: 0 },
    { day: 'Mié', tasks: 0 },
    { day: 'Jue', tasks: 0 },
    { day: 'Vie', tasks: 0 },
    { day: 'Sáb', tasks: 0 },
    { day: 'Dom', tasks: 0 }
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.currentEmployee = null;
  }

  ngOnInit() {
    // Obtener datos del usuario autenticado
    const user = this.authService.user;
    if (user) {
      // Buscar el empleado en la lista
      const employee = this.employees.find(e => e.email === user.email);
      this.currentEmployee = {
        id: employee?.id || 1,
        name: user.name,
        email: user.email,
        role: employee?.rol || 'Administrador',
        avatar: user.picture || employee?.avatar || '/images/user/user-01.png'
      };
    } else {
      // Fallback - Usar Ana García como usuario por defecto
      this.currentEmployee = {
        id: 1,
        name: 'Ana García',
        email: 'ana.garcia@empresa.com',
        role: 'Administrador',
        avatar: '/images/user/user-01.png'
      };
    }

    // Cargar datos del sistema
    this.loadTaskData();
    this.loadRecentActivities();
  }

  get isAdmin(): boolean {
    return this.currentEmployee?.role === 'Administrador';
  }

  loadTaskData() {
    // Datos reales del sistema que coinciden con el calendario
    const targetDate = '2026-01-15';

    // Tareas del calendario
    const allTasks: Task[] = [
      {
        id: 't1',
        title: 'Ana García - Sede Central',
        location: 'Sede Central',
        dueDate: targetDate,
        employeeName: 'Ana García',
        employeeColor: '#10b981',
        startTime: '09:00',
        endTime: '10:00'
      },
      {
        id: 't2',
        title: 'Luis Pérez - Oficina Norte',
        location: 'Oficina Norte',
        dueDate: targetDate,
        employeeName: 'Luis Pérez',
        employeeColor: '#6366f1',
        startTime: '10:00',
        endTime: '11:00'
      },
      {
        id: 't3',
        title: 'María López - Centro Operativo',
        location: 'Centro Operativo',
        dueDate: targetDate,
        employeeName: 'María López',
        employeeColor: '#f97316',
        startTime: '11:00',
        endTime: '12:00'
      },
      {
        id: 't4',
        title: 'Ana García - Oficina Norte',
        location: 'Oficina Norte',
        dueDate: targetDate,
        employeeName: 'Ana García',
        employeeColor: '#10b981',
        startTime: '12:00',
        endTime: '13:00'
      },
      {
        id: 't5',
        title: 'Luis Pérez - Sede Central',
        location: 'Sede Central',
        dueDate: targetDate,
        employeeName: 'Luis Pérez',
        employeeColor: '#6366f1',
        startTime: '14:00',
        endTime: '15:00'
      },
      {
        id: 't6',
        title: 'María López - Sede Central',
        location: 'Sede Central',
        dueDate: '2026-01-16',
        employeeName: 'María López',
        employeeColor: '#f97316',
        startTime: '09:00',
        endTime: '11:00'
      },
      {
        id: 't7',
        title: 'Ana García - Centro Operativo',
        location: 'Centro Operativo',
        dueDate: '2026-01-17',
        employeeName: 'Ana García',
        employeeColor: '#10b981',
        startTime: '10:00',
        endTime: '12:00'
      }
    ];

    // Si es usuario normal, filtrar solo sus tareas
    const filteredTasks = this.isAdmin 
      ? allTasks 
      : allTasks.filter(t => t.employeeName === this.currentEmployee?.name);

    // Estadísticas
    if (this.isAdmin) {
      // Vista de administrador: todas las tareas
      this.taskStats.total = allTasks.length;
      this.taskStats.todayTasks = allTasks.filter(t => t.dueDate === targetDate).length;
      
      const weekStart = new Date('2026-01-15');
      const weekEnd = new Date('2026-01-19');
      this.taskStats.thisWeekTasks = allTasks.filter(t => {
        const taskDate = new Date(t.dueDate);
        return taskDate >= weekStart && taskDate <= weekEnd;
      }).length;

      this.taskStats.pendingVacations = 1; // Luis Pérez tiene una pendiente

      // Estadísticas semanales con todas las tareas
      this.weeklyStats = [
        { day: 'Lun', tasks: 5 },
        { day: 'Mar', tasks: 1 },
        { day: 'Mié', tasks: 1 },
        { day: 'Jue', tasks: 0 },
        { day: 'Vie', tasks: 0 },
        { day: 'Sáb', tasks: 0 },
        { day: 'Dom', tasks: 0 }
      ];
    } else {
      // Vista de usuario: solo sus tareas
      this.taskStats.total = filteredTasks.length;
      this.taskStats.todayTasks = filteredTasks.filter(t => t.dueDate === targetDate).length;
      
      const weekStart = new Date('2026-01-15');
      const weekEnd = new Date('2026-01-19');
      this.taskStats.thisWeekTasks = filteredTasks.filter(t => {
        const taskDate = new Date(t.dueDate);
        return taskDate >= weekStart && taskDate <= weekEnd;
      }).length;

      // Para usuarios: mostrar si tiene vacaciones aprobadas
      this.taskStats.pendingVacations = 0; // Los usuarios ven sus vacaciones de otra forma

      // Contar tareas por día (solo del usuario)
      const tasksByDay: Record<string, number> = {};
      filteredTasks.forEach(t => {
        const date = new Date(t.dueDate);
        const dayOfWeek = date.getDay();
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          tasksByDay[dayOfWeek] = (tasksByDay[dayOfWeek] || 0) + 1;
        }
      });

      this.weeklyStats = [
        { day: 'Lun', tasks: tasksByDay[1] || 0 },
        { day: 'Mar', tasks: tasksByDay[2] || 0 },
        { day: 'Mié', tasks: tasksByDay[3] || 0 },
        { day: 'Jue', tasks: tasksByDay[4] || 0 },
        { day: 'Vie', tasks: tasksByDay[5] || 0 },
        { day: 'Sáb', tasks: 0 },
        { day: 'Dom', tasks: 0 }
      ];
    }

    // Próximas tareas (filtradas según el rol)
    this.upcomingTasks = filteredTasks
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  }

  loadRecentActivities() {
    if (this.isAdmin) {
      // Actividades del sistema completo para administradores
      this.recentActivities = [
        {
          id: 1,
          action: 'Tareas programadas para hoy',
          description: '5 tareas asignadas a diferentes empleados',
          date: 'Hoy',
          icon: '📋'
        },
        {
          id: 2,
          action: 'Solicitud de vacaciones',
          description: 'Luis Pérez: del 20 al 24 de enero',
          date: 'Hace 5 días',
          icon: '🏖️'
        },
        {
          id: 3,
          action: 'Vacaciones aprobadas',
          description: 'María López: día libre el 18 de enero',
          date: 'Hace 3 días',
          icon: '✅'
        },
        {
          id: 4,
          action: 'Sistema de empleados',
          description: '3 empleados activos en el sistema',
          date: 'Hace 1 semana',
          icon: '👥'
        }
      ];
    } else {
      // Actividades personales para usuarios normales
      const userName = this.currentEmployee?.name || 'Usuario';
      const userTasks = this.taskStats.todayTasks;
      
      this.recentActivities = [
        {
          id: 1,
          action: 'Tus tareas de hoy',
          description: `Tienes ${userTasks} ${userTasks === 1 ? 'tarea asignada' : 'tareas asignadas'} para hoy`,
          date: 'Hoy',
          icon: '📋'
        },
        {
          id: 2,
          action: 'Tareas de esta semana',
          description: `${this.taskStats.thisWeekTasks} ${this.taskStats.thisWeekTasks === 1 ? 'tarea programada' : 'tareas programadas'}`,
          date: 'Esta semana',
          icon: '📅'
        },
        {
          id: 3,
          action: 'Tu perfil',
          description: `Asignado a ${this.locations.length} ubicaciones diferentes`,
          date: 'Información',
          icon: '👤'
        }
      ];

      // Agregar actividad de vacaciones si aplica
      if (userName === 'María López') {
        this.recentActivities.splice(1, 0, {
          id: 4,
          action: 'Vacaciones aprobadas',
          description: 'Tu día libre del 18 de enero fue aprobado',
          date: 'Hace 3 días',
          icon: '✅'
        });
      } else if (userName === 'Luis Pérez') {
        this.recentActivities.splice(1, 0, {
          id: 4,
          action: 'Solicitud pendiente',
          description: 'Vacaciones del 20-24 enero pendiente de aprobación',
          date: 'Hace 5 días',
          icon: '⏳'
        });
      }
    }
  }

  navigateToCalendar() {
    this.router.navigate(['/calendar']);
  }

  navigateToEmployees() {
    this.router.navigate(['/empleados']);
  }

  navigateToLocations() {
    this.router.navigate(['/localizacion']);
  }
}
