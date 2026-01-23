import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageBreadcrumbComponent } from '../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { AuthService } from '../../shared/services/auth.service';
import { TaskService } from '../../shared/services/task.service';
import { EmployeeService } from '../../shared/services/employee.service';
import { VacationService } from '../../shared/services/vacation.service';
import { LocationService } from '../../shared/services/location.service';
import { Utf8FixPipe } from '../../shared/pipes/utf8-fix.pipe';
import { Router } from '@angular/router';

interface Task {
  id: number;
  title: string;
  location_id: number;
  location_name?: string;
  assigned_to: string;
  employee_name?: string;
  start_date: string;
  end_date: string;
  start_time: string;
  end_time: string;
  status: string;
  employee_color?: string;
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
}

interface Location {
  id: number;
  name: string;
  city: string;
}

@Component({
  selector: 'app-blank',
  standalone: true,
  imports: [PageBreadcrumbComponent, CommonModule, Utf8FixPipe],
  templateUrl: './blank.component.html',
  styles: ``
})
export class BlankComponent implements OnInit, OnDestroy {
    todayLabel: string = '';
    weekLabel: string = '';
  currentEmployee: any;

  taskStats = {
    total: 0,
    todayTasks: 0,
    thisWeekTasks: 0,
    pendingVacations: 0
  };

  employees: Employee[] = [];
  locations: Location[] = [];
  upcomingTasks: Task[] = [];

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
    private taskService: TaskService,
    private employeeService: EmployeeService,
    private vacationService: VacationService,
    private locationService: LocationService,
    private router: Router
  ) {
    this.currentEmployee = null;
  }

  ngOnInit() {
    // Obtener datos del usuario autenticado
    const user = this.authService.user;
    const employee = this.authService.employee;
    if (user) {
      this.currentEmployee = {
        name: user.name,
        email: user.email,
        role: employee?.role || 'Usuario',
        avatar: user.picture || '/images/user/user-01.png'
      };
    }

    // Etiquetas de fecha
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' };
    this.todayLabel = today.toLocaleDateString('es-ES', options);

    // Calcular rango de semana (lunes a domingo)
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay(); // 1 (lunes) - 7 (domingo)
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const monthShort = (date: Date) => date.toLocaleDateString('es-ES', { month: 'short' });
    this.weekLabel = `${monday.getDate()}-${sunday.getDate()} ${monthShort(today)}`;

    // Cargar datos del sistema
    this.loadData();
  }

  ngOnDestroy() {
  }

  get isAdmin(): boolean {
    return this.currentEmployee?.role === 'admin';
  }

  async loadData() {
    try {
      // Cargar empleados
      const employees = await this.employeeService.getAllEmployees();
      this.employees = employees.map(e => ({
        id: e.id,
        name: e.name,
        email: e.email
      }));

      // Cargar ubicaciones
      const locations = await this.locationService.getAll();
      this.locations = locations.map((l: any) => ({
        id: l.id,
        name: l.name,
        city: l.city || ''
      }));

      // Cargar tareas
      await this.loadTaskData();

      // Cargar actividades recientes
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    }
  }

  async loadTaskData() {
    try {
      let allTasks: any[] = [];

      if (this.isAdmin) {
        // Para administradores: cargar todas las tareas
        allTasks = await this.taskService.getAll();
      } else {
        // Para usuarios: cargar solo sus tareas
        const employee = this.authService.employee;
        if (employee?.id) {
          const tasks = await this.taskService.getByEmployeeId(employee.id);
          allTasks = tasks;
        }
      }

      // Enriquecer tareas con información de empleado y ubicación
      const enrichedTasks = allTasks.map(task => {
        const employee = this.employees.find(e => e.id === task.assigned_to);
        const location = this.locations.find(l => l.id === task.location_id);

        const colors = ['#10b981', '#6366f1', '#f97316', '#ec4899', '#14b8a6', '#8b5cf6'];
        const colorIndex = task.assigned_to % colors.length;

        return {
          ...task,
          employee_name: employee?.name || 'Sin asignar',
          location_name: location?.name || 'Sin ubicación',
          employee_color: colors[colorIndex]
        };
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const weekStart = new Date(today);
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() + 7);

      // Estadísticas
      this.taskStats.total = enrichedTasks.length;
      this.taskStats.todayTasks = enrichedTasks.filter(t => {
        const taskDate = new Date(t.start_date);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === today.getTime();
      }).length;

      this.taskStats.thisWeekTasks = enrichedTasks.filter(t => {
        const taskDate = new Date(t.start_date);
        return taskDate >= weekStart && taskDate <= weekEnd;
      }).length;

      // Próximas tareas: solo desde hoy en adelante
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      this.upcomingTasks = enrichedTasks
        .filter(t => {
          const taskDate = new Date(t.start_date);
          taskDate.setHours(0, 0, 0, 0);
          return taskDate >= now;
        })
        .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
        .slice(0, 5);

      // Estadísticas semanales por día
      const tasksByDay: Record<number, number> = {};
      enrichedTasks.forEach(t => {
        const taskDate = new Date(t.start_date);
        const dayOfWeek = taskDate.getDay();
        tasksByDay[dayOfWeek] = (tasksByDay[dayOfWeek] || 0) + 1;
      });

      this.weeklyStats = [
        { day: 'Lun', tasks: tasksByDay[1] || 0 },
        { day: 'Mar', tasks: tasksByDay[2] || 0 },
        { day: 'Mié', tasks: tasksByDay[3] || 0 },
        { day: 'Jue', tasks: tasksByDay[4] || 0 },
        { day: 'Vie', tasks: tasksByDay[5] || 0 },
        { day: 'Sáb', tasks: tasksByDay[6] || 0 },
        { day: 'Dom', tasks: tasksByDay[0] || 0 }
      ];

      // Vacaciones pendientes (solo para admin)
      if (this.isAdmin) {
        try {
          const vacations = await this.vacationService.getAll();
          this.taskStats.pendingVacations = vacations.filter((v: any) => v.status === 'pending').length;
        } catch (error) {
          console.log('No se pudieron cargar las vacaciones');
          this.taskStats.pendingVacations = 0;
        }
      }
    } catch (error) {
      console.error('Error cargando datos de tareas:', error);
    }
  }


  navigateToCalendar() {
    const employee = this.authService.employee;
    if (employee && employee.id) {
      this.router.navigate(['/calendar'], { queryParams: { employee: employee.id } });
    } else {
      this.router.navigate(['/calendar']);
    }
  }

  navigateToEmployees() {
    this.router.navigate(['/empleados']);
  }

  navigateToLocations() {
    this.router.navigate(['/localizacion']);
  }

  /**
   * Formatea una hora quitando los segundos (HH:MM:SS -> HH:MM)
   */
  formatTimeWithoutSeconds(time: string | undefined | null): string {
    if (!time) return '';
    const parts = time.split(':');
    return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : time;
  }
}
