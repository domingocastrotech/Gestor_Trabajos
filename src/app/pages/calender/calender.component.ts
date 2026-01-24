import { KeyValuePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';

import { Component, ViewChild, ChangeDetectorRef, HostListener, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EventInput, CalendarOptions, DateSelectArg, EventClickArg } from '@fullcalendar/core';
import esLocale from '@fullcalendar/core/locales/es';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { AlertComponent } from '../../shared/components/ui/alert/alert.component';
import { NotificationService } from '../../shared/services/notification.service';
import { TaskService, Task, TaskAssignmentEmailPayload } from '../../shared/services/task.service';
import { VacationService, VacationRequest as VacationRequestDB } from '../../shared/services/vacation.service';
import { EmployeeService, Employee } from '../../shared/services/employee.service';
import { LocationService, Location } from '../../shared/services/location.service';
import { AuthService } from '../../shared/services/auth.service';
import { SupabaseService } from '../../shared/services/supabase.service';

// Interfaz para los días configurados por localización
interface TooltipLocDay {
  id: number;
  locations_id: number;
  day: number; // 1=Lunes, 2=Martes, ..., 7=Domingo
}

// Interfaz local para manejar vacaciones en el componente
interface VacationRequest {
  id: number;
  employeeId: number;
  employeeName: string;
  startDate: string;
  endDate: string;
  type: 'vacation' | 'day-off';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
}

interface AlertItem {
  id: number;
  variant: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar: string;
    location?: string;
    employeeId?: number;
    employeeName?: string;
    employeeColor?: string;
    employeeAvatar?: string;
    startTime?: string;
    endTime?: string;
    isVacation?: boolean;
    vacationType?: 'vacation' | 'day-off';
  };
}

@Component({
  selector: 'app-calender',
  imports: [
    CommonModule,
    FormsModule,
    FullCalendarModule,
    ModalComponent,
    AlertComponent
  ],
  templateUrl: './calender.component.html',
  styles: `
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-8px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    :host ::ng-deep {
      .fc .fc-daygrid-day-frame {
        min-height: 100px;
      }

      .fc .fc-daygrid-day-events {
        margin-top: 2px;
      }

      .fc .fc-event {
        padding: 0 !important;
        border-radius: 4px !important;
      }

      .fc .fc-event-main {
        padding: 4px !important;
        overflow: hidden;
      }

      .fc-daygrid-event {
        margin-bottom: 2px !important;
      }

      .fc-event-title {
        white-space: normal !important;
        font-size: 11px !important;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
      }

      .fc .fc-more-link {
        color: #111827 !important; /* negro en modo claro */
        font-weight: 600;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 9999px;
        background: #e5e7eb;
        border: 1px solid #d1d5db;
        font-size: 13px;
        margin-top: 8px;
        margin-left: auto;
        margin-right: auto;
        width: auto;
        text-align: center;
        text-decoration: none;
      }

      .fc .fc-more-link .fc-more-text {
        font-size: inherit;
        font-weight: 700;
        line-height: 1.2;
      }
      .fc .fc-more-link span,
      .fc .fc-more-link .fc-more-link-inner {
        color: inherit !important;
      }

      .dark .fc .fc-more-link,
      .dark .fc .fc-more-link:hover,
      .dark .fc .fc-more-link:focus,
      .dark .fc .fc-more-link:visited,
      :host-context(.dark) .fc .fc-more-link,
      :host-context(.dark) .fc .fc-more-link:hover,
      :host-context(.dark) .fc .fc-more-link:focus,
      :host-context(.dark) .fc .fc-more-link:visited {
        color: #ffffff !important; /* blanco en modo oscuro */
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.16);
      }

      .dark .fc .fc-more-link span,
      .dark .fc .fc-more-link .fc-more-link-inner,
      :host-context(.dark) .fc .fc-more-link span,
      :host-context(.dark) .fc .fc-more-link .fc-more-link-inner {
        color: #ffffff !important;
      }

      /* Eliminado el estilo circular del icono para evitar la "bola" */

      /* Indicador de localizaciones faltantes - Badge rojo */
      .missing-location-badge {
        position: absolute;
        top: 4px;
        right: 4px;
        width: 14px;
        height: 14px;
        background-color: #ef4444 !important;
        border-radius: 50%;
        color: white;
        font-size: 9px;
        font-weight: bold;
        display: flex !important;
        align-items: center;
        justify-content: center;
        z-index: 10;
        cursor: help;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        transition: transform 0.2s ease;
      }

      .missing-location-badge:hover {
        transform: scale(1.2);
      }

      .dark .missing-location-badge,
      :host-context(.dark) .missing-location-badge {
        background-color: #ef4444 !important;
      }

      .fc-daygrid-day-top {
        position: relative;
      }

      /* Tooltip personalizado */
      .missing-locations-tooltip {
        position: fixed !important;
        background-color: #fee2e2 !important;
        color: #991b1b !important;
        padding: 12px 16px !important;
        border-radius: 8px !important;
        border: 1px solid #fecaca !important;
        font-size: 13px !important;
        white-space: normal !important;
        z-index: 99999 !important;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2) !important;
        min-width: 180px !important;
        max-width: 300px !important;
        text-align: left !important;
        line-height: 1.6 !important;
        pointer-events: none !important;
        display: block !important;
        opacity: 1 !important;
        visibility: visible !important;
      }

      .dark .missing-locations-tooltip,
      :host-context(.dark) .missing-locations-tooltip {
        background-color: #fee2e2 !important;
        color: #991b1b !important;
        border-color: #fecaca !important;
      }

      .missing-locations-tooltip::after {
        content: '' !important;
        position: absolute !important;
        bottom: -8px !important;
        left: 50% !important;
        transform: translateX(-50%) !important;
        width: 0 !important;
        height: 0 !important;
        border-left: 8px solid transparent !important;
        border-right: 8px solid transparent !important;
        border-top: 8px solid #fee2e2 !important;
      }

      .dark .missing-locations-tooltip::after,
      :host-context(.dark) .missing-locations-tooltip::after {
        border-top-color: #fee2e2 !important;
      }

      .missing-locations-tooltip strong {
        color: #991b1b !important;
        font-weight: 600 !important;
        display: block !important;
        margin-bottom: 4px !important;
      }

      .fc .fc-daygrid-day-top {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        padding: 4px;
      }

      .fc .fc-daygrid-day-number {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }

    }
  `
})
export class CalenderComponent {
    isVacationSubmitting = false;
  isAddEventLoading = false;

  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  events: CalendarEvent[] = [];
  allEvents: CalendarEvent[] = [];
  selectedEvent: CalendarEvent | null = null;
  eventTitle = '';
  eventStartDate = '';
  eventEndDate = '';
  eventLevel = '';
  eventLocation = '';
  eventLocationDays: number[] = [];
  daysOfWeek = [
    { num: 1, name: 'Lunes' },
    { num: 2, name: 'Martes' },
    { num: 3, name: 'Miércoles' },
    { num: 4, name: 'Jueves' },
    { num: 5, name: 'Viernes' },
    { num: 6, name: 'Sábado' },
    { num: 0, name: 'Domingo' }
  ];
  eventEmployeeId: number | undefined = undefined;
  eventStartTime = '09:00';
  eventEndTime = '17:00';
  sendTaskEmail = false;
  taskEmailDescription = '';
  isOpen = false;

  // Control de conflictos de horarios
  conflictEvent: any = null;
  showConflictModal = false;
  pendingEventData: any = null;

  // Control de conflictos de ubicación
  locationConflictEvent: any = null;
  showLocationConflictModal = false;
  pendingLocationConflictData: any = null;

  // Filtro de empleado
  selectedEmployeeFilter: number | 'all' = 'all';

  // Modal de eventos por día (más de 3)
  isDayModalOpen = false;
  selectedDay = '';
  selectedDayEvents: Array<{
    id: string;
    title: string;
    location?: string;
    employeeName?: string;
    employeeColor?: string;
    employeeAvatar?: string;
    startTime?: string;
    endTime?: string;
    isVacation?: boolean;
    vacationType?: 'vacation' | 'day-off';
  }> = [];

  alerts: AlertItem[] = [];
  private alertId = 0;

  // Modal de decisión de vacaciones (aprobar/rechazar con comentario)
  vacationDecisionModal: {
    isOpen: boolean;
    requestId: number | null;
    action: 'approve' | 'reject' | null;
    sendEmail: boolean;
    emailComment: string;
    isLoading: boolean;
  } = {
    isOpen: false,
    requestId: null,
    action: null,
    sendEmail: false,
    emailComment: '',
    isLoading: false
  };

  // Modal de confirmación de borrado de tarea
  deleteConfirmation: {
    isOpen: boolean;
    taskId: string | null;
    taskTitle: string;
  } = {
    isOpen: false,
    taskId: null,
    taskTitle: ''
  };

  // Modal de confirmación de envío de solicitud de vacaciones
  vacationSendConfirmation = {
    isOpen: false,
  };

  // Modal de solicitud de vacaciones enviada
  vacationRequestSentModal: {
    isOpen: boolean;
    vacationType: string;
    startDate: string;
    endDate: string;
    autoCloseTimer?: any;
  } = {
    isOpen: false,
    vacationType: '',
    startDate: '',
    endDate: ''
  };

  // Modal de confirmación de correo de tarea
  taskEmailSentModal: {
    isOpen: boolean;
    taskTitle: string;
    employeeName: string;
    description?: string;
    autoCloseTimer?: ReturnType<typeof setTimeout>;
  } = {
    isOpen: false,
    taskTitle: '',
    employeeName: '',
    description: '',
  };

  // Modal de resultado de decisión de vacaciones
  vacationResultModal: {
    isOpen: boolean;
    success: boolean;
    action: 'approve' | 'reject' | null;
    employeeName: string;
    vacationType: string;
    emailSent: boolean;
    autoCloseTimer?: any;
  } = {
    isOpen: false,
    success: true,
    action: null,
    employeeName: '',
    vacationType: '',
    emailSent: false
  };

  // Sistema de vacaciones
  vacationRequests: VacationRequest[] = [];
  isVacationModalOpen = false;
  isVacationManagementOpen = false;
  vacationStartDate = '';
  vacationEndDate = '';
  vacationType: 'vacation' | 'day-off' = 'vacation';
  vacationReason = '';
  currentUser: Employee | null = null;

  // Calendario personalizado
  showStartDatePicker = false;
  showEndDatePicker = false;
  calendarMonth = new Date().getMonth();
  calendarYear = new Date().getFullYear();
  calendarDays: (number | null)[] = [];
  monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  locations: Location[] = [];
  employees: Employee[] = [];
  tooltipLocDays: TooltipLocDay[] = []; // Días configurados para cada localización

  calendarsEvents: Record<string, string> = {
    Danger: 'danger',
    Success: 'success',
    Primary: 'primary',
    Warning: 'warning'
  };

  calendarOptions!: CalendarOptions;
  isCalendarLoading = true;
  loadingMessage = 'Cargando calendario...';

  constructor(
    private notificationService: NotificationService,
    private taskService: TaskService,
    private vacationService: VacationService,
    private employeeService: EmployeeService,
    private locationService: LocationService,
    private authService: AuthService,
    private supabaseService: SupabaseService,
    private route: ActivatedRoute,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    // Inicializar calendarOptions inmediatamente para evitar el error "viewType '' is not available"
    // Detectar si es móvil
    const isMobile = window.innerWidth < 768;

    this.calendarOptions = {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: 'dayGridMonth',
      locale: esLocale,
      headerToolbar: {
        left: isMobile ? 'prev,next' : 'prev,next today',
        center: 'title',
        right: isMobile ? '' : 'dayGridMonth'
      },
      editable: true,
      selectable: true,
      events: [],
      select: (info) => this.handleDateSelect(info),
      eventClick: (info) => this.handleEventClick(info),
      dateClick: (info) => this.handleDayClick(info.dateStr, info.allDay, info.jsEvent),
      dayMaxEventRows: isMobile ? 2 : 3,
      moreLinkContent: () => ({ html: '<span class="fc-more-text text-xs">+ Más</span>' }),
      moreLinkClick: (args) => {
        this.openDayEventsModal(args.date.toISOString().split('T')[0]);
        return 'none';
      },
      eventContent: (arg) => this.renderEventContent(arg),
      dayCellDidMount: (arg) => this.addMissingLocationIndicator(arg),
      datesSet: () => {
        // Cuando cambias de vista o mes, se vuelven a renderizar las celdas
        console.log('[CalendarComponent] Vista del calendario cambió, badges deberían actualizarse');
      },
      contentHeight: 'auto',
      height: isMobile ? 'auto' : undefined
    };
  }

  async ngOnInit() {
    this.isCalendarLoading = true;
    try {
      // Leer query param employee
      let employeeParam: number | 'all' = 'all';
      await new Promise<void>(resolve => {
        this.route.queryParams.subscribe(params => {
          if (params['employee']) {
            const empId = Number(params['employee']);
            if (!isNaN(empId)) {
              employeeParam = empId;
            }
          }
          resolve();
        });
      });

      // Cargar usuario actual
      const employee = this.authService.employee;
      if (employee) {
        this.currentUser = {
          id: employee.id,
          name: employee.name,
          email: employee.email,
          color: employee.color,
          role: employee.role === 'Administrador' ? 'Administrador' : 'Usuario',
          is_active: true
        };
      }

      // Cargar datos desde la base de datos en orden para que tareas conozcan empleados y localizaciones
      await this.loadEmployees();
      await this.loadLocations();
      await this.loadTooltipLocDays(); // Cargar los días configurados para cada localización
      await this.loadTasks();
      await this.loadVacationRequests();

      // Si no es admin, forzar filtro del usuario actual
      if (!this.isAdmin && this.currentUser) {
        this.selectedEmployeeFilter = this.currentUser.id;
        this.applyEmployeeFilter();
      }
      // Si hay parámetro de empleado y es admin, seleccionarlo y filtrar
      else if (employeeParam !== 'all') {
        this.selectedEmployeeFilter = employeeParam;
        this.applyEmployeeFilter();
      }

      // Inicializar el calendario
      this.initializeCalendar();

      // Forzar detección de cambios de Angular
      this.changeDetectorRef.detectChanges();

      // Dar tiempo para que el calendario renderice las celdas con los datos
      setTimeout(() => {
        this.isCalendarLoading = false;
        console.log('[CalendarComponent] Todos los datos cargados - loading finalizado');
      }, 200);
    } catch (error) {
      console.error('[CalendarComponent] Error inicializando:', error);
      this.showAlert('error', 'Error', 'No se pudieron cargar los datos del calendario');
      this.isCalendarLoading = false;
    }
  }

  ngAfterViewInit() {
    // Este hook se ejecuta después de que la vista está lista
    // pero el loading se maneja en ngOnInit después de cargar los datos

    // Agregar listener para detectar hover en badges de vacaciones
    setTimeout(() => {
      const vacationBadges = document.querySelectorAll('.vacation-badge-debug');
      console.log('[ngAfterViewInit] Encontrados badges de vacaciones:', vacationBadges.length);

      vacationBadges.forEach(badge => {
        const eventId = badge.getAttribute('data-event-id');
        badge.addEventListener('mouseenter', (e) => {
          console.log('[vacation-badge] MOUSEENTER en badge:', {
            eventId,
            x: (e as MouseEvent).clientX,
            y: (e as MouseEvent).clientY,
            target: (e.target as HTMLElement).tagName
          });
        });

        badge.addEventListener('mouseleave', (e) => {
          console.log('[vacation-badge] MOUSELEAVE en badge:', {
            eventId,
            x: (e as MouseEvent).clientX,
            y: (e as MouseEvent).clientY
          });
        });

        badge.addEventListener('mousemove', (e) => {
          // Solo loguear cada 500ms para no saturar la consola
          const now = Date.now();
          if (!(badge as any).__lastMouseMoveLog || now - (badge as any).__lastMouseMoveLog > 500) {
            console.log('[vacation-badge] MOUSEMOVE en badge:', {
              eventId,
              x: (e as MouseEvent).clientX,
              y: (e as MouseEvent).clientY
            });
            (badge as any).__lastMouseMoveLog = now;
          }
        });
      });
    }, 500);
  }

  async loadEmployees() {
    try {
      // Traer todos los empleados, estén activos o no, para asignación
      this.employees = await this.employeeService.getAllEmployees();
      console.log('[CalendarComponent] Empleados cargados (todos):', this.employees.length, this.employees);
    } catch (error) {
      console.error('[CalendarComponent] Error cargando empleados:', error);
    }
  }

  async loadLocations() {
    try {
      this.locations = await this.locationService.getAll();
    } catch (error) {
      console.error('[CalendarComponent] Error cargando localizaciones:', error);
    }
  }

  async loadTooltipLocDays() {
    try {
      const result = await this.supabaseService.supabase
        .from('tooltip_loc_dias')
        .select('*');

      if (result.error) {
        console.error('[CalendarComponent] Error cargando tooltip_loc_dias:', result.error);
        this.tooltipLocDays = [];
      } else {
        this.tooltipLocDays = (result.data as TooltipLocDay[]) || [];
        console.log('[CalendarComponent] tooltip_loc_dias cargados:', this.tooltipLocDays);
      }
    } catch (error) {
      console.error('[CalendarComponent] Error en loadTooltipLocDays:', error);
      this.tooltipLocDays = [];
    }
  }

  async loadTasks() {
    try {
      const tasks = await this.taskService.getAll();
      this.events = tasks.map(task => this.taskToCalendarEvent(task));
      this.allEvents = [...this.events];
    } catch (error) {
      console.error('[CalendarComponent] Error cargando tareas:', error);
    }
  }

  async loadVacationRequests() {
    try {
      console.log('[CalendarComponent] Cargando solicitudes de vacaciones desde Supabase...');
      const requests = await this.vacationService.getAll();
      console.log('[CalendarComponent] Solicitudes obtenidas de la BD:', requests);

      this.vacationRequests = requests.map(req => ({
        id: req.id,
        employeeId: req.employee_id,
        employeeName: this.getEmployeeName(req.employee_id),
        startDate: req.start_date,
        endDate: req.end_date,
        type: req.type,
        reason: req.reason || '',
        status: req.status,
        requestDate: this.formatRequestDate(req.request_date || '')
      }));

      console.log('[CalendarComponent] vacationRequests después de mapear:', this.vacationRequests);
      console.log('[CalendarComponent] pendingRequests:', this.pendingRequests);

      // Agregar vacaciones aprobadas al calendario
      this.addApprovedVacationsToCalendar();
    } catch (error) {
      console.error('[CalendarComponent] Error cargando solicitudes de vacaciones:', error);
    }
  }

  taskToCalendarEvent(task: Task): CalendarEvent {
    const employee = this.employees.find(e => e.id === task.employee_id);
    const location = this.locations.find(l => l.id === task.location_id);

    return {
      id: task.id,
      title: task.title,
      start: task.start_date,
      end: task.end_date || undefined,
      backgroundColor: employee?.color || '#6366f1',
      borderColor: employee?.color || '#6366f1',
      extendedProps: {
        calendar: task.calendar || 'Primary',
        location: location?.name,
        employeeId: task.employee_id || undefined,
        employeeName: employee?.name,
        employeeColor: employee?.color,
        employeeAvatar: employee?.avatar,
        startTime: task.start_time || undefined,
        endTime: task.end_time || undefined,
        isVacation: task.is_vacation,
        vacationType: task.vacation_type || undefined
      }
    };
  }

  getEmployeeName(employeeId: number): string {
    return this.employees.find(e => e.id === employeeId)?.name || 'Desconocido';
  }

  initializeCalendar() {
    // Crear nuevas opciones de calendario con todos los datos cargados
    const newCalendarOptions: CalendarOptions = {
      ...this.calendarOptions,
      events: this.events,
      dateClick: (info) => this.handleDayClick(info.dateStr, info.allDay, info.jsEvent),
      select: (info) => this.handleDateSelect(info),
      eventClick: (info) => this.handleEventClick(info),
      dayMaxEventRows: 3,
      moreLinkContent: () => ({ html: '<span class="fc-more-text">+ Más tareas</span>' }),
      moreLinkClick: (args) => {
        this.openDayEventsModal(args.date.toISOString().split('T')[0]);
        return 'none';
      },
      eventContent: (arg) => this.renderEventContent(arg),
      dayCellDidMount: (arg) => this.addMissingLocationIndicator(arg)
    };

    // Reasignar completamente las opciones (importante para que se procese nuevamente)
    this.calendarOptions = newCalendarOptions;

    console.log('[CalendarComponent] Calendario inicializado. Datos disponibles:');
    console.log('  - tooltipLocDays:', this.tooltipLocDays.length);
    console.log('  - eventos:', this.events.length);
    console.log('  - localizaciones:', this.locations.length);
  }

  handleDateSelect(selectInfo: DateSelectArg) {
    if (!this.isAdmin) {
      this.showAlert('warning', 'Acceso Denegado', 'Solo los administradores pueden crear tareas');
      return;
    }
    // Siempre mostrar el modal de lista de tareas del día
    this.openDayEventsModal(selectInfo.startStr);
  }

  handleDayClick(dateStr: string, allDay: boolean, event?: MouseEvent) {
    // Verificar si el click fue en el badge de ubicación faltante
    if (event) {
      const target = event.target as HTMLElement;
      // Verificar si el target es el badge o está dentro del badge
      // Buscar hasta 5 niveles de padres para encontrar el badge
      let element: HTMLElement | null = target;
      let foundBadge = false;

      for (let i = 0; i < 5; i++) {
        if (!element) break;
        if (element.classList?.contains('missing-location-badge')) {
          foundBadge = true;
          break;
        }
        element = element.parentElement;
      }

      if (foundBadge) {
        // No abrir el modal si se clickeó el badge
        console.log('[CalendarComponent] Click en badge detectado, no abriendo modal');
        event.stopPropagation();
        event.preventDefault();
        return;
      }
    }

    // Siempre mostrar el modal de lista de tareas del día
    this.openDayEventsModal(dateStr);
  }

  handleEventClick(clickInfo: EventClickArg) {
    const event = clickInfo.event as any;

    // Si es una vacación, no permitir edición (solo desde gestión de solicitudes)
    if (event.extendedProps['isVacation']) {
      return;
    }

    // Si no es admin, no permitir editar eventos
    if (!this.isAdmin) {
      this.showAlert('warning', 'Acceso Denegado', 'Solo los administradores pueden editar tareas');
      return;
    }

    // Si el día tiene más de 3 tareas, abrimos el modal de lista en vez de editar individual
    const dayStr = this.formatLocalDate(event.start);
    const dayEvents = this.getEventsForDay(dayStr);
    if (dayEvents.length > 3) {
      this.openDayEventsModal(dayStr);
      return;
    }

    this.selectedEvent = {
      id: event.id,
      title: event.title,
      start: event.startStr,
      end: event.endStr,
      extendedProps: {
        calendar: event.extendedProps['calendar'] || 'Primary',
        location: event.extendedProps['location'],
        employeeId: event.extendedProps['employeeId'],
        employeeName: event.extendedProps['employeeName'],

        employeeColor: event.extendedProps['employeeColor'],
        startTime: event.extendedProps['startTime'],
        endTime: event.extendedProps['endTime']
      }
    };
    this.eventTitle = event.title;
    this.eventStartDate = event.startStr;
    this.eventEndDate = event.endStr || '';
    this.eventLevel = event.extendedProps['calendar'];
    this.eventLocation = event.extendedProps['location'] || '';
    this.eventEmployeeId = event.extendedProps['employeeId'];
    this.eventStartTime = event.extendedProps['startTime'] || '09:00';
    this.eventEndTime = event.extendedProps['endTime'] || '17:00';
    this.sendTaskEmail = false;
    this.taskEmailDescription = '';
    this.openModal();
  }

  handleAddOrUpdateEvent() {
    if (this.isAddEventLoading) {
      return;
    }
    // Validar que tenga empleado y localización
    if (!this.eventEmployeeId) {
      this.showAlert('warning', 'Empleado requerido', 'Debes seleccionar un empleado para crear una tarea');
      return;
    }

    if (!this.eventLocation) {
      this.showAlert('warning', 'Localización requerida', 'Debes seleccionar una localización para crear una tarea');
      return;
    }

    // Validar que el empleado no esté de vacaciones
    if (this.isEmployeeOnVacation(this.eventEmployeeId, this.eventStartDate)) {
      this.showAlert('error', 'Empleado de vacaciones', 'No se puede asignar una tarea a un empleado que está de vacaciones en esa fecha');
      return;
    }

    // Detectar conflictos de horarios
    const conflict = this.detectTimeConflict();
    if (conflict) {
      this.conflictEvent = conflict;
      this.pendingEventData = {
        employeeId: this.eventEmployeeId,
        location: this.eventLocation,
        startDate: this.eventStartDate,
        endDate: this.eventEndDate,
        startTime: this.eventStartTime,
        endTime: this.eventEndTime,
        isUpdate: !!this.selectedEvent
      };

      this.showConflictModal = true;
      return;
    }

    // Detectar conflictos de ubicación (otro empleado en la misma ubicación, día y rango horario)
    const locationConflict = this.detectLocationConflict();
    if (locationConflict) {
      this.locationConflictEvent = locationConflict;
      this.pendingLocationConflictData = {
        employeeId: this.eventEmployeeId,
        location: this.eventLocation,
        startDate: this.eventStartDate,
        endDate: this.eventEndDate,
        startTime: this.eventStartTime,
        endTime: this.eventEndTime,
        isUpdate: !!this.selectedEvent
      };

      this.showLocationConflictModal = true;
      return;
    }

    // Proceder con la creación/actualización del evento
    this.isAddEventLoading = true;
    this.proceedWithEventCreation().finally(() => {
      this.isAddEventLoading = false;
    });
  }

  async proceedWithEventCreation() {
    this.showConflictModal = false;

    const employee = this.eventEmployeeId ? this.employees.find(e => e.id === this.eventEmployeeId) : null;
    const location = this.eventLocation ? this.locations.find(l => l.name === this.eventLocation) : null;

    // Generar título automáticamente
    let generatedTitle = 'Tarea';
    if (employee) {
      if (location) {
        generatedTitle = `${employee.name} - ${location.name}`;
      } else {
        generatedTitle = employee.name;
      }
    } else if (location) {
      generatedTitle = `Tarea en ${location.name}`;
    }

    try {
      if (this.selectedEvent) {
        // Capturar datos antiguos antes de actualizar
        const oldStartDateRaw = this.selectedEvent.start;
        let oldStartDate = '';
        if (oldStartDateRaw) {
          if (typeof oldStartDateRaw === 'string') {
            oldStartDate = oldStartDateRaw;
          } else if (oldStartDateRaw instanceof Date) {
            oldStartDate = this.formatLocalDate(oldStartDateRaw);
          } else if (typeof oldStartDateRaw === 'number') {
            oldStartDate = this.formatLocalDate(new Date(oldStartDateRaw));
          } else if (Array.isArray(oldStartDateRaw)) {
            // DateInput puede ser [year, month, day]
            const [y, m, d] = oldStartDateRaw;
            oldStartDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          }
        }
        const oldStartTime = this.selectedEvent.extendedProps?.startTime || null;
        const oldEndTime = this.selectedEvent.extendedProps?.endTime || null;
        const oldLocationName = this.selectedEvent.extendedProps?.location || null;
        const oldLocation = oldLocationName ? this.locations.find(l => l.name === oldLocationName) : null;
        const oldEmployeeId = this.selectedEvent.extendedProps?.employeeId || null;
        const oldEmployee = oldEmployeeId ? this.employees.find(e => e.id === oldEmployeeId) : null;

        // Detectar cambio de empleado
        const employeeChanged = oldEmployeeId && this.eventEmployeeId && oldEmployeeId !== this.eventEmployeeId;

        // Actualizar tarea existente en la base de datos
        await this.taskService.update(this.selectedEvent.id!, {
          title: generatedTitle,
          start_date: this.eventStartDate,
          end_date: this.eventEndDate || null,
          start_time: this.eventStartTime,
          end_time: this.eventEndTime,
          calendar: 'Primary',
          location_id: location?.id || null,
          employee_id: this.eventEmployeeId || null,
          is_vacation: false,
          vacation_type: null
        });

        // Formatear horarios para eliminar segundos (HH:MM:SS -> HH:MM)
        const formatTime = (time: string | null): string | null => {
          if (!time) return null;
          return time.substring(0, 5);
        };

        // Si cambió el empleado, enviar correos automáticamente (sin checkbox)
        if (employeeChanged) {
          // Correo al empleado antiguo: tarea eliminada
          if (oldEmployee?.email) {
            const payloadRemoval: TaskAssignmentEmailPayload = {
              to: oldEmployee.email,
              employeeName: oldEmployee.name,
              assignedBy: this.currentUser?.name || 'Administrador',
              taskTitle: generatedTitle,
              start_date: oldStartDate,
              end_date: this.eventEndDate || null,
              start_time: formatTime(oldStartTime),
              end_time: formatTime(oldEndTime),
              location: oldLocation?.name || null,
              description: null,
              isUpdate: true,
              isEmployeeRemoval: true // Nuevo flag para indicar eliminación por cambio de empleado
            };

            try {
              await this.taskService.sendAssignmentEmail(payloadRemoval);
              console.log('[CalendarComponent] ✅ Correo de eliminación enviado a:', oldEmployee.email);
            } catch (emailError) {
              console.error('[CalendarComponent] ❌ Error enviando correo de eliminación:', emailError);
            }
          }

          // Correo al empleado nuevo: tarea reasignada
          if (employee?.email) {
            const payloadReassignment: TaskAssignmentEmailPayload = {
              to: employee.email,
              employeeName: employee.name,
              assignedBy: this.currentUser?.name || 'Administrador',
              taskTitle: generatedTitle,
              start_date: this.eventStartDate,
              end_date: this.eventEndDate || null,
              start_time: formatTime(this.eventStartTime),
              end_time: formatTime(this.eventEndTime),
              location: location?.name || null,
              description: null,
              isUpdate: true,
              isEmployeeReassignment: true, // Nuevo flag para indicar reasignación
              previousEmployeeName: oldEmployee?.name || 'Empleado anterior'
            };

            try {
              await this.taskService.sendAssignmentEmail(payloadReassignment);
              console.log('[CalendarComponent] ✅ Correo de reasignación enviado a:', employee.email);
            } catch (emailError) {
              console.error('[CalendarComponent] ❌ Error enviando correo de reasignación:', emailError);
            }
          }
        }
        // Si NO cambió el empleado y se marca el checkbox, enviar correo de actualización normal
        else if (this.sendTaskEmail) {
          if (employee?.email) {
            const payload: TaskAssignmentEmailPayload = {
              to: employee.email,
              employeeName: employee.name,
              assignedBy: this.currentUser?.name || 'Administrador',
              taskTitle: generatedTitle,
              start_date: this.eventStartDate,
              end_date: this.eventEndDate || null,
              start_time: formatTime(this.eventStartTime),
              end_time: formatTime(this.eventEndTime),
              location: location?.name || null,
              description: this.taskEmailDescription?.trim() || null,
              isUpdate: true, // Indicar que es una edición
              // Datos antiguos para comparación
              old_start_date: oldStartDate,
              old_start_time: formatTime(oldStartTime),
              old_end_time: formatTime(oldEndTime),
              old_location: oldLocation?.name || null
            };

            try {
              await this.taskService.sendAssignmentEmail(payload);
              this.showTaskEmailSentModal(
                generatedTitle,
                employee.name,
                this.taskEmailDescription?.trim() || ''
              );
            } catch (emailError) {
              console.error('[CalendarComponent] ❌ Error enviando correo de tarea actualizada:', emailError);
              this.showAlert('warning', 'Correo no enviado', 'La tarea se actualizó pero no se pudo enviar el correo.');
            }
          } else {
            this.showAlert('warning', 'Correo no enviado', 'La tarea se actualizó pero el empleado no tiene correo registrado.');
          }
        }

        // Recargar tareas
        await this.loadTasks();
        this.applyEmployeeFilter();

        // Forzar re-renderizado del calendario cambiando vista temporalmente
        this.forceCalendarRefresh();

        this.showAlert('success', 'Tarea actualizada', 'La tarea se ha actualizado correctamente');
      } else {
        // Crear nueva tarea en la base de datos
        const newTask = await this.taskService.create({
          title: generatedTitle,
          start_date: this.eventStartDate,
          end_date: this.eventEndDate || null,
          start_time: this.eventStartTime,
          end_time: this.eventEndTime,
          calendar: 'Primary',
          level: null,
          location_id: location?.id || null,
          employee_id: this.eventEmployeeId || null,
          description: null,
          created_by_employee_id: this.currentUser?.id || null,
          is_vacation: false,
          vacation_type: null
        });

        if (this.sendTaskEmail) {
          if (employee?.email) {
            // Formatear horarios para eliminar segundos (HH:MM:SS -> HH:MM)
            const formatTime = (time: string | null): string | null => {
              if (!time) return null;
              return time.substring(0, 5);
            };

            const payload: TaskAssignmentEmailPayload = {
              to: employee.email,
              employeeName: employee.name,
              assignedBy: this.currentUser?.name || 'Administrador',
              taskTitle: generatedTitle,
              start_date: this.eventStartDate,
              end_date: this.eventEndDate || null,
              start_time: formatTime(this.eventStartTime),
              end_time: formatTime(this.eventEndTime),
              location: location?.name || null,
              description: this.taskEmailDescription?.trim() || null
            };

            try {
              await this.taskService.sendAssignmentEmail(payload);
              this.showTaskEmailSentModal(
                generatedTitle,
                employee.name,
                this.taskEmailDescription?.trim() || ''
              );
            } catch (emailError) {
              console.error('[CalendarComponent] ❌ Error enviando correo de tarea:', emailError);
              this.showAlert('warning', 'Correo no enviado', 'La tarea se creó pero no se pudo enviar el correo.');
            }
          } else {
            this.showAlert('warning', 'Correo no enviado', 'La tarea se creó pero el empleado no tiene correo registrado.');
          }
        }

        // Recargar tareas desde la base de datos para asegurar consistencia
        await this.loadTasks();
        this.applyEmployeeFilter();

        // Forzar re-renderizado del calendario cambiando vista temporalmente
        this.forceCalendarRefresh();

        // Enviar notificación al empleado asignado (siempre, incluso si es el mismo usuario)
        console.log('[CalendarComponent] Verificando si enviar notificación...');
        console.log('[CalendarComponent] Employee:', employee);
        console.log('[CalendarComponent] CurrentUser:', this.currentUser);

        if (employee && employee.email) {
          const isSelfAssignment = this.currentUser && employee.id === this.currentUser.id;
          const message = isSelfAssignment
            ? `Te has asignado una nueva tarea: "${generatedTitle}"`
            : `${this.currentUser?.name || 'Alguien'} te ha asignado una tarea: "${generatedTitle}"`;

          console.log('[CalendarComponent] ✅ Enviando notificación a:', employee.email);
          console.log('[CalendarComponent] Tipo de asignación:', isSelfAssignment ? 'Auto-asignación' : 'Asignación a otro');

          try {
            await this.notificationService.addNotification({
              type: 'task',
              title: `Nueva tarea asignada`,
              message: message,
              recipient_email: employee.email,
              data: { eventId: newTask.id }
            });
            console.log('[CalendarComponent] ✅ Notificación enviada exitosamente');
          } catch (notifError) {
            console.error('[CalendarComponent] ❌ Error enviando notificación:', notifError);
          }
        } else {
          console.log('[CalendarComponent] ⚠️ No se envió notificación. Razón:', !employee ? 'No hay empleado asignado' : 'No hay email del empleado');
        }

        this.showAlert('success', 'Tarea creada', 'La tarea se ha registrado correctamente');
      }

      this.closeModal();
      this.resetModalFields();
    } catch (error) {
      console.error('[CalendarComponent] Error guardando tarea:', error);
      this.showAlert('error', 'Error', 'No se pudo guardar la tarea');
    }
  }

  rejectEventCreation() {
    this.showConflictModal = false;
    this.conflictEvent = null;
    this.pendingEventData = null;
  }

  rejectLocationConflictCreation() {
    this.showLocationConflictModal = false;
    this.locationConflictEvent = null;
    this.pendingLocationConflictData = null;
  }

  proceedWithLocationConflictCreation() {
    this.showLocationConflictModal = false;
    // Proceder con la creación del evento ignorando el conflicto de ubicación
    this.isAddEventLoading = true;
    this.proceedWithEventCreation().finally(() => {
      this.isAddEventLoading = false;
    });
  }

  private applyEmployeeFilter() {
    const filtered = this.selectedEmployeeFilter === 'all'
      ? this.allEvents
      : this.allEvents.filter(ev => ev.extendedProps.employeeId === this.selectedEmployeeFilter);

    this.events = filtered;
    const api = this.calendarComponent?.getApi();
    if (api) {
      api.removeAllEvents();
      filtered.forEach(ev => api.addEvent(ev));
    }
  }

  private openDayEventsModal(dateStr: string) {
    const calendarApi = this.calendarComponent.getApi();
    const selectedDate = new Date(dateStr + 'T00:00:00'); // Crear fecha sin zona horaria

    const eventsForDay = calendarApi.getEvents().filter(ev => {
      if (!ev.start) return false;

      const eventStart = new Date(ev.start);

      // Si el evento tiene una fecha de fin
      if (ev.end) {
        const eventEnd = new Date(ev.end);
        // Para eventos de día completo (allDay), la fecha de fin es exclusiva
        // Por ejemplo, si termina el 25, realmente termina el 24
        if (ev.allDay) {
          // Restar un día a la fecha de fin para obtener el último día incluido
          eventEnd.setDate(eventEnd.getDate() - 1);
        }

        // Verificar si la fecha seleccionada está dentro del rango del evento
        return selectedDate >= new Date(eventStart.toDateString()) &&
               selectedDate <= new Date(eventEnd.toDateString());
      }

      // Si no hay fecha de fin, solo verificar la fecha de inicio
      const day = this.formatLocalDate(ev.start);
      return day === dateStr;
    });

    this.selectedDay = dateStr;
    this.selectedDayEvents = eventsForDay.map(ev => ({
      id: ev.id,
      title: ev.title,
      location: ev.extendedProps['location'],
      employeeName: ev.extendedProps['employeeName'],
      employeeColor: ev.extendedProps['employeeColor'],
      employeeAvatar: ev.extendedProps['employeeAvatar'],
      startTime: ev.extendedProps['startTime'],
      endTime: ev.extendedProps['endTime'],
      isVacation: ev.extendedProps['isVacation'] || false,
      vacationType: ev.extendedProps['vacationType'],
    }));

    this.isDayModalOpen = true;
  }

  handleDayEventEdit(eventId: string) {
    const calendarApi = this.calendarComponent.getApi();
    const ev = calendarApi.getEventById(eventId);
    if (!ev) return;

    // No permitir editar vacaciones
    if (ev.extendedProps['isVacation']) {
      return;
    }

    this.selectedEvent = {
      id: ev.id,
      title: ev.title,
      start: ev.startStr,
      end: ev.endStr,
      extendedProps: {
        calendar: ev.extendedProps['calendar'] || 'Primary',
        location: ev.extendedProps['location'],
        employeeId: ev.extendedProps['employeeId'],
        employeeName: ev.extendedProps['employeeName'],

        employeeColor: ev.extendedProps['employeeColor'],
        startTime: ev.extendedProps['startTime'],
        endTime: ev.extendedProps['endTime'],
      }
    };
    this.eventTitle = ev.title;
    this.eventStartDate = ev.startStr;
    this.eventEndDate = ev.endStr || '';
    this.eventLevel = ev.extendedProps['calendar'];
    this.eventLocation = ev.extendedProps['location'] || '';
    this.eventEmployeeId = ev.extendedProps['employeeId'];
    this.eventStartTime = ev.extendedProps['startTime'] || '09:00';
    this.eventEndTime = ev.extendedProps['endTime'] || '17:00';
    this.sendTaskEmail = false;
    this.taskEmailDescription = '';

    this.isDayModalOpen = false;
    this.openModal();
  }

  handleDayEventDelete(eventId: string) {
    const calendarApi = this.calendarComponent.getApi();
    const ev = calendarApi.getEventById(eventId);
    if (!ev) return;

    // No permitir eliminar vacaciones
    if (ev.extendedProps['isVacation']) {
      return;
    }

    // Abrir modal de confirmación personalizado
    this.openDeleteConfirmation(eventId, ev.title);
  }

  /**
   * Abre el modal de confirmación para eliminar tarea
   */
  openDeleteConfirmation(taskId: string, taskTitle: string) {
    // Cerrar el modal de la lista de tareas si está abierto
    this.isDayModalOpen = false;

    this.deleteConfirmation = {
      isOpen: true,
      taskId: taskId,
      taskTitle: taskTitle
    };
  }

  /**
   * Cierra el modal de confirmación
   */
  closeDeleteConfirmation() {
    const dayToReopen = this.selectedDay; // Guardar antes de cerrar

    this.deleteConfirmation = {
      isOpen: false,
      taskId: null,
      taskTitle: ''
    };

    // Reabrir el modal de la lista de tareas si estaba abierto
    if (dayToReopen) {
      this.isDayModalOpen = true;
    }
  }

  /**
   * Confirma y ejecuta la eliminación de la tarea
   */
  async confirmDeleteTask() {
    if (this.deleteConfirmation.taskId === null) return;

    const taskId = this.deleteConfirmation.taskId;
    const dayToReload = this.selectedDay; // Guardar antes de cerrar

    // Cerrar el modal de confirmación inmediatamente
    this.closeDeleteConfirmation();

    try {
      // Eliminar de la base de datos
      await this.taskService.delete(taskId);

      // Eliminar del calendario
      const calendarApi = this.calendarComponent.getApi();
      const ev = calendarApi.getEventById(taskId);
      if (ev) {
        ev.remove();
      }
      this.events = this.events.filter(e => e.id !== taskId);
      this.allEvents = this.allEvents.filter(e => e.id !== taskId); // También actualizar allEvents

      // Forzar re-renderizado del calendario cambiando vista temporalmente
      this.forceCalendarRefresh();

      // Recargar la vista del modal si estaba abierto
      if (dayToReload) {
        this.openDayEventsModal(dayToReload);
      }

      this.showAlert('success', 'Tarea eliminada', 'La tarea se ha eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar tarea:', error);
      this.showAlert('error', 'Error al eliminar', 'No se pudo eliminar la tarea. Por favor, inténtalo de nuevo.');
    }
  }

  handleDayEventCreate() {
    if (!this.selectedDay) return;
    this.resetModalFields();
    this.eventStartDate = this.selectedDay;
    this.eventEndDate = this.selectedDay;
    this.isDayModalOpen = false;
    this.openModal();
  }

  private getEventsForDay(dateStr: string) {
    const calendarApi = this.calendarComponent.getApi();
    return calendarApi.getEvents().filter(ev => {
      if (!ev.start) return false;
      return this.formatLocalDate(ev.start) === dateStr;
    });
  }

  handleEmployeeFilterChange(value: string) {
    // Los usuarios no-admin no pueden cambiar el filtro
    if (!this.isAdmin) {
      return;
    }
    this.selectedEmployeeFilter = value === 'all' ? 'all' : Number(value);
    this.applyEmployeeFilter();
  }

  private formatLocalDate(date: Date | null): string {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }


  resetModalFields() {
    this.eventTitle = '';
    this.eventStartDate = '';
    this.eventEndDate = '';
    this.eventLevel = '';
    this.eventLocation = '';
    this.eventEmployeeId = undefined;
    this.eventStartTime = '09:00';
    this.eventEndTime = '17:00';
    this.sendTaskEmail = false;
    this.taskEmailDescription = '';
    this.selectedEvent = null;
  }

  openModal() {
    this.isOpen = true;
  }

  closeModal() {
    this.isOpen = false;
    this.resetModalFields();
  }

  renderEventContent(eventInfo: any) {
    const employeeName = eventInfo.event.extendedProps.employeeName;
    const employeeAvatar = eventInfo.event.extendedProps.employeeAvatar;
    const location = eventInfo.event.extendedProps.location;
    const startTime = eventInfo.event.extendedProps.startTime;
    const endTime = eventInfo.event.extendedProps.endTime;
    const timeText = startTime && endTime ? `${this.formatTimeWithoutSeconds(startTime)}-${this.formatTimeWithoutSeconds(endTime)}` : '';
    const bgColor = eventInfo.event.backgroundColor || '#6366f1';
    const isVacation = eventInfo.event.extendedProps.isVacation;
    const vacationType = eventInfo.event.extendedProps.vacationType;

    // Renderizado especial para vacaciones
    if (isVacation) {
      const icon = vacationType === 'vacation' ? '🏖️' : '📅';
      console.log('[renderEventContent] Renderizando evento de vacaciones:', {
        title: eventInfo.event.title,
        employeeName,
        vacationType,
        bgColor,
        elementId: eventInfo.event.id
      });

      return {
        html: `
          <div class="flex items-center justify-center gap-1 p-2 text-xs font-bold vacation-badge-debug"
               data-event-id="${eventInfo.event.id}"
               onmouseenter="console.log('[tooltip] mouseenter en vacation badge', this)"
               onmouseleave="console.log('[tooltip] mouseleave en vacation badge', this)"
               style="background-color: ${bgColor}; border-radius: 4px; color: white;">
            <span style="font-size: 16px;">${icon}</span>
            <span class="truncate">${eventInfo.event.title}</span>
          </div>
        `
      };
    }

    // Renderizado normal para tareas con avatar
    const avatarHtml = employeeAvatar
      ? `<img src="${employeeAvatar}" alt="${employeeName}" class="w-5 h-5 rounded-full object-cover border border-white/20" style="flex-shrink: 0;">`
      : `<div class="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold" style="background-color: rgba(255,255,255,0.2); flex-shrink: 0;">${employeeName ? employeeName[0] : 'T'}</div>`;

    return {
      html: `
        <div class="flex flex-col gap-0.5 p-1 text-xs" style="background-color: ${bgColor}; border-radius: 4px; color: white;">
          <div class="flex items-center gap-1 min-h-[20px]">
            ${avatarHtml}
            <span class="font-semibold truncate">${employeeName || 'Tarea'}</span>
          </div>
          ${location ? `<div class="truncate text-white/90 pl-6">📍 ${location}</div>` : ''}
          ${timeText ? `<div class="truncate text-white/90 pl-6">🕐 ${timeText}</div>` : ''}
        </div>
      `
    };
  }

  // Detectar conflictos de horarios
  private detectTimeConflict(): any {
    if (!this.eventEmployeeId || !this.eventStartDate) {
      return null;
    }

    const newEventStart = this.timeStringToMinutes(this.eventStartTime);
    const newEventEnd = this.timeStringToMinutes(this.eventEndTime);
    const newEventDate = this.eventStartDate;

    // Buscar eventos del mismo empleado en el mismo día
    const conflictingEvent = this.allEvents.find(event => {
      // Ignorar el evento actual si lo estamos editando (comparar tanto con selectedEvent como con el ID)
      if (this.selectedEvent && (event.id === this.selectedEvent.id || String(event.id) === String(this.selectedEvent.id))) {
        return false;
      }

      if (event.extendedProps.employeeId !== this.eventEmployeeId) {
        return false; // Diferente empleado
      }

      const eventDate = this.formatLocalDate(new Date(event.start as string));
      if (eventDate !== newEventDate) {
        return false; // Diferente día
      }

      // Comparar rangos de horas
      const existingStart = this.timeStringToMinutes(event.extendedProps.startTime || '09:00');
      const existingEnd = this.timeStringToMinutes(event.extendedProps.endTime || '17:00');

      // Hay conflicto si los rangos se solapan
      return !(newEventEnd <= existingStart || newEventStart >= existingEnd);
    });

    return conflictingEvent || null;
  }

  /**
   * Detecta si ya hay otro empleado en la misma ubicación, día y rango horario
   */
  private detectLocationConflict(): any {
    if (!this.eventLocation || !this.eventStartDate) {
      return null;
    }

    const newEventStart = this.timeStringToMinutes(this.eventStartTime);
    const newEventEnd = this.timeStringToMinutes(this.eventEndTime);
    const newEventDate = this.eventStartDate;

    // Buscar eventos de OTROS empleados en la misma ubicación en el mismo día
    const conflictingEvent = this.allEvents.find(event => {
      // Ignorar el evento actual si lo estamos editando
      if (this.selectedEvent && (event.id === this.selectedEvent.id || String(event.id) === String(this.selectedEvent.id))) {
        return false;
      }

      // Ignorar eventos del mismo empleado (solo importa si OTRO empleado está en la ubicación)
      if (event.extendedProps.employeeId === this.eventEmployeeId) {
        return false;
      }

      // Verificar que sea la misma ubicación
      if (event.extendedProps.location !== this.eventLocation) {
        return false;
      }

      const eventDate = this.formatLocalDate(new Date(event.start as string));
      if (eventDate !== newEventDate) {
        return false; // Diferente día
      }

      // Comparar rangos de horas
      const existingStart = this.timeStringToMinutes(event.extendedProps.startTime || '09:00');
      const existingEnd = this.timeStringToMinutes(event.extendedProps.endTime || '17:00');

      // Hay conflicto si los rangos se solapan
      return !(newEventEnd <= existingStart || newEventStart >= existingEnd);
    });

    return conflictingEvent || null;
  }

  private timeStringToMinutes(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private showAlert(variant: AlertItem['variant'], title: string, message: string) {
    const id = ++this.alertId;
    this.alerts = [...this.alerts, { id, variant, title, message }];

    setTimeout(() => this.dismissAlert(id), 4000);
  }

  dismissAlert(id: number) {
    this.alerts = this.alerts.filter(alert => alert.id !== id);
  }

  /**
   * Fuerza la actualización del calendario cambiando temporalmente la vista
   * Esto re-ejecuta dayCellDidMount y actualiza los badges
   */
  private forceCalendarRefresh() {
    const calendarApi = this.calendarComponent.getApi();
    const currentView = calendarApi.view.type;

    // Cambiar a una vista temporal y volver inmediatamente
    const tempView = currentView === 'dayGridMonth' ? 'timeGridWeek' : 'dayGridMonth';
    calendarApi.changeView(tempView);

    // Usar setTimeout para asegurar que el cambio se procesa
    setTimeout(() => {
      calendarApi.changeView(currentView);
    }, 10);
  }

  /**
   * Formatea una hora quitando los segundos (HH:MM:SS -> HH:MM)
   */
  formatTimeWithoutSeconds(time: string | undefined): string {
    if (!time) return '';
    const parts = time.split(':');
    return parts.length >= 2 ? `${parts[0]}:${parts[1]}` : time;
  }

  exportToGoogleCalendar() {
    // Generar archivo .ics (iCalendar) que se puede importar a Google Calendar
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Gestor Trabajos//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Calendario de Trabajos',
      'X-WR-TIMEZONE:Europe/Madrid'
    ];

    // Agregar cada evento del calendario actual
    this.events.forEach(event => {
      let startDate = new Date(event.start as string);
      let endDate = event.end ? new Date(event.end as string) : new Date(startDate);

      // Si el evento tiene horas específicas, combinarlas con la fecha
      if (event.extendedProps.startTime) {
        const [hours, minutes] = event.extendedProps.startTime.split(':');
        startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }

      if (event.extendedProps.endTime) {
        const [hours, minutes] = event.extendedProps.endTime.split(':');
        endDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      } else {
        // Si no hay hora de fin, usar 1 hora después del inicio
        endDate = new Date(startDate.getTime() + 3600000);
      }

      // Formatear fechas en formato iCalendar (YYYYMMDDTHHMMSS) en zona horaria local
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}${month}${day}T${hours}${minutes}${seconds}`;
      };

      icsContent.push('BEGIN:VEVENT');
      icsContent.push(`DTSTART;TZID=Europe/Madrid:${formatDate(startDate)}`);
      icsContent.push(`DTEND;TZID=Europe/Madrid:${formatDate(endDate)}`);
      icsContent.push(`SUMMARY:${event.title || 'Tarea'}`);

      if (event.extendedProps.location) {
        icsContent.push(`LOCATION:${event.extendedProps.location}`);
      }

      if (event.extendedProps.employeeName) {
        const timeInfo = event.extendedProps.startTime && event.extendedProps.endTime
          ? `\\nHorario: ${event.extendedProps.startTime} - ${event.extendedProps.endTime}`
          : '';
        const description = `Empleado: ${event.extendedProps.employeeName}\\nLocalización: ${event.extendedProps.location || 'N/A'}${timeInfo}`;
        icsContent.push(`DESCRIPTION:${description}`);
      }

      icsContent.push(`UID:${event.id}@gestortrabajos.com`);
      icsContent.push(`DTSTAMP:${formatDate(new Date())}`);
      icsContent.push('END:VEVENT');
    });

    icsContent.push('END:VCALENDAR');

    // Crear archivo y descargar
    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `calendario-trabajos-${new Date().toISOString().split('T')[0]}.ics`;
    link.click();
    window.URL.revokeObjectURL(link.href);

    this.showAlert('success', 'Exportación exitosa', 'El archivo .ics ha sido descargado. Puedes importarlo a Google Calendar desde la opción "Importar".');
  }

  // ========== SISTEMA DE VACACIONES ==========

  openVacationModal() {
    this.vacationStartDate = '';
    this.vacationEndDate = '';
    this.vacationType = 'vacation';
    this.vacationReason = '';
    this.isVacationModalOpen = true;
  }

  closeVacationModal() {
    this.isVacationModalOpen = false;
  }

  async openVacationManagement() {
    // Recargar solicitudes de vacaciones antes de abrir el modal
    await this.loadVacationRequests();
    this.isVacationManagementOpen = true;
  }

  closeVacationManagement() {
    this.isVacationManagementOpen = false;
  }

  // Estado de pestañas para la gestión de vacaciones
  vacationTab: 'pending' | 'approved' | 'rejected' | 'completed' = 'pending';

  setVacationTab(tab: 'pending' | 'approved' | 'rejected' | 'completed') {
    this.vacationTab = tab;
  }

  private isDatePast(dateStr: string): boolean {
    // Comparación sin hora utilizando YYYY-MM-DD
    const today = new Date();
    const [y, m, d] = [today.getFullYear(), today.getMonth() + 1, today.getDate()];
    const todayStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return dateStr < todayStr;
  }

  // Listas filtradas por pestaña
  get pendingRequests(): VacationRequest[] {
    return this.vacationRequests.filter(r => r.status === 'pending');
  }

  get approvedRequests(): VacationRequest[] {
    // Aprobadas que aún no han terminado (hoy o futuro)
    return this.vacationRequests.filter(r => r.status === 'approved' && !this.isDatePast(r.endDate));
  }

  get rejectedRequests(): VacationRequest[] {
    return this.vacationRequests.filter(r => r.status === 'rejected');
  }

  get completedRequests(): VacationRequest[] {
    // "Cumplidas": aprobadas y cuya fecha de fin ya pasó
    return this.vacationRequests.filter(r => r.status === 'approved' && this.isDatePast(r.endDate));
  }

  async submitVacationRequest() {
      if (this.isVacationSubmitting) return;
      // Validación de campos vacíos
      if (!this.vacationStartDate || !this.vacationEndDate || !this.vacationReason.trim()) {
        let msg = 'Debes completar todos los campos para solicitar vacaciones.';
        if (!this.vacationStartDate) msg = 'Debes seleccionar la fecha de inicio.';
        else if (!this.vacationEndDate) msg = 'Debes seleccionar la fecha de fin.';
        else if (!this.vacationReason.trim()) msg = 'Debes indicar el motivo de la solicitud.';
        this.showAlert('warning', 'Campos incompletos', msg);
        return;
      }

      // Validación de fechas
      const start = new Date(this.vacationStartDate);
      const end = new Date(this.vacationEndDate);
      if (start > end) {
        this.showAlert('error', 'Fechas incorrectas', 'La fecha de inicio no puede ser posterior a la fecha de fin.');
        return;
      }

      // Validación de solapamiento con vacaciones existentes
      const overlapping = this.vacationRequests.some(r =>
        r.employeeId === this.currentUser?.id &&
        r.status === 'approved' &&
        ((new Date(r.startDate) <= end && new Date(r.endDate) >= start))
      );
      if (overlapping) {
        this.showAlert('error', 'Ya tienes vacaciones', 'Ya tienes vacaciones aprobadas en los días seleccionados.');
        return;
      }

      if (!this.currentUser) return;

      this.isVacationSubmitting = true;
      try {
        const newRequest = await this.vacationService.create({
          employee_id: this.currentUser.id,
          start_date: this.vacationStartDate,
          end_date: this.vacationEndDate,
          type: this.vacationType,
          reason: this.vacationReason,
          status: 'pending'
        });

        // Recargar solicitudes
        await this.loadVacationRequests();

        // Enviar notificación a todos los administradores
        const admins = this.employees.filter(emp => emp.role === 'Administrador');
        for (const admin of admins) {
          await this.notificationService.addNotification({
            type: 'vacation-request',
            title: 'Nueva solicitud de vacaciones',
            message: `${this.currentUser.name} ha solicitado ${this.vacationType === 'vacation' ? 'vacaciones' : 'un día libre'} del ${this.formatDate(this.vacationStartDate)} al ${this.formatDate(this.vacationEndDate)}`,
            recipient_email: admin.email,
            data: { requestId: newRequest.id }
          });
        }

        // Cerrar modal primero
        this.closeVacationModal();
        this.changeDetectorRef.detectChanges();

        // Mostrar modal de confirmación después de cerrar el modal
        setTimeout(() => {
          this.showVacationRequestSentModal(
            this.vacationType === 'vacation' ? 'Vacaciones' : 'Día libre',
            this.formatDate(this.vacationStartDate),
            this.formatDate(this.vacationEndDate)
          );
        }, 100);
      } catch (error) {
        console.error('[CalendarComponent] Error creando solicitud de vacaciones:', error);
        this.closeVacationModal();
        this.changeDetectorRef.detectChanges();

        setTimeout(() => {
          this.showAlert('error', 'Error', 'No se pudo enviar la solicitud');
        }, 100);
      } finally {
        this.isVacationSubmitting = false;
      }
    }

  /**
   * Abre el popup de confirmación antes de enviar la solicitud
   * Muestra aviso de posible entrega en spam y disponibilidad en notificaciones.
   */
  openVacationSendConfirmation() {
    if (this.isVacationSubmitting) return;

    // Validaciones iguales a las del envío para evitar abrir el popup si falta algo
    if (!this.vacationStartDate || !this.vacationEndDate || !this.vacationReason.trim()) {
      let msg = 'Debes completar todos los campos para solicitar vacaciones.';
      if (!this.vacationStartDate) msg = 'Debes seleccionar la fecha de inicio.';
      else if (!this.vacationEndDate) msg = 'Debes seleccionar la fecha de fin.';
      else if (!this.vacationReason.trim()) msg = 'Debes indicar el motivo de la solicitud.';
      this.showAlert('warning', 'Campos incompletos', msg);
      return;
    }

    const start = new Date(this.vacationStartDate);
    const end = new Date(this.vacationEndDate);
    if (start > end) {
      this.showAlert('error', 'Fechas incorrectas', 'La fecha de inicio no puede ser posterior a la fecha de fin.');
      return;
    }

    const overlapping = this.vacationRequests.some(r =>
      r.employeeId === this.currentUser?.id &&
      r.status === 'approved' &&
      ((new Date(r.startDate) <= end && new Date(r.endDate) >= start))
    );
    if (overlapping) {
      this.showAlert('error', 'Ya tienes vacaciones', 'Ya tienes vacaciones aprobadas en los días seleccionados.');
      return;
    }

    if (!this.currentUser) return;

    this.vacationSendConfirmation.isOpen = true;
  }

  closeVacationSendConfirmation() {
    this.vacationSendConfirmation.isOpen = false;
  }

  async confirmVacationSend() {
    // Cerrar popup y ejecutar el envío real
    this.vacationSendConfirmation.isOpen = false;
    await this.submitVacationRequest();
  }


  clearVacationAlerts() {
    this.alerts = [];
  }

  async approveVacationRequest(requestId: number) {
    console.log('[CalendarComponent] approveVacationRequest called with requestId:', requestId);
    this.vacationDecisionModal = {
      isOpen: true,
      requestId,
      action: 'approve',
      sendEmail: true,
      emailComment: '',
      isLoading: false
    };
    console.log('[CalendarComponent] vacationDecisionModal after update:', this.vacationDecisionModal);
    this.changeDetectorRef.detectChanges();
  }

  async rejectVacationRequest(requestId: number) {
    console.log('[CalendarComponent] rejectVacationRequest called with requestId:', requestId);
    this.vacationDecisionModal = {
      isOpen: true,
      requestId,
      action: 'reject',
      sendEmail: true,
      emailComment: '',
      isLoading: false
    };
    console.log('[CalendarComponent] vacationDecisionModal after update:', this.vacationDecisionModal);
    this.changeDetectorRef.detectChanges();
  }

  async confirmVacationDecision() {
    const { requestId, action, sendEmail, emailComment } = this.vacationDecisionModal;
    if (!requestId || !action || !this.currentUser) {
      this.closeVacationDecisionModal();
      return;
    }

    const request = this.vacationRequests.find(r => r.id === requestId);
    if (!request) {
      this.closeVacationDecisionModal();
      return;
    }

    // Establecer estado de carga
    this.vacationDecisionModal.isLoading = true;
    this.changeDetectorRef.detectChanges();

    try {
      if (action === 'approve') {
        await this.vacationService.approve(
          requestId,
          this.currentUser.id,
          emailComment || undefined,
          sendEmail
        );
        request.status = 'approved';
        this.addVacationToCalendar(request);
        this.changeDetectorRef.detectChanges();
      } else if (action === 'reject') {
        await this.vacationService.reject(
          requestId,
          this.currentUser.id,
          emailComment || undefined,
          sendEmail
        );
        request.status = 'rejected';
        this.changeDetectorRef.detectChanges();
      }

      // Notificar al empleado (en la app)
      const requestEmployee = this.employees.find(e => e.id === request.employeeId);
      if (requestEmployee) {
        const actionText = action === 'approve' ? 'aprobada' : 'rechazada';
        const typeText = request.type === 'vacation' ? 'vacaciones' : 'día libre';
        await this.notificationService.addNotification({
          type: 'vacation-request',
          title: `Solicitud ${actionText}`,
          message: `Tu solicitud de ${typeText} del ${this.formatDate(request.startDate)} al ${this.formatDate(request.endDate)} ha sido ${actionText}`,
          recipient_email: requestEmployee.email,
          data: { requestId: request.id }
        });
      }

      // Cerrar modal primero
      this.vacationDecisionModal.isLoading = false;
      this.closeVacationDecisionModal();
      this.changeDetectorRef.detectChanges();

      // Mostrar modal de resultado después de cerrar el modal de decisión
      setTimeout(() => {
        const typeText = request.type === 'vacation' ? 'vacaciones' : 'día libre';
        this.showVacationResultModal(action, request.employeeName, typeText, sendEmail);
      }, 100);

    } catch (error) {
      console.error('[CalendarComponent] Error en decisión de vacación:', error);
      this.vacationDecisionModal.isLoading = false;
      this.closeVacationDecisionModal();
      this.changeDetectorRef.detectChanges();

      setTimeout(() => {
        this.showAlert('error', 'Error', 'No se pudo procesar la decisión');
      }, 100);
    }
  }

  showVacationResultModal(action: 'approve' | 'reject', employeeName: string, vacationType: string, emailSent: boolean = false) {
    // Limpiar timer anterior si existe
    if (this.vacationResultModal.autoCloseTimer) {
      clearTimeout(this.vacationResultModal.autoCloseTimer);
    }

    this.vacationResultModal = {
      isOpen: true,
      success: true,
      action,
      employeeName,
      vacationType,
      emailSent,
      autoCloseTimer: setTimeout(() => {
        this.closeVacationResultModal();
      }, 5000)
    };
    this.changeDetectorRef.detectChanges();
  }

  closeVacationResultModal() {
    if (this.vacationResultModal.autoCloseTimer) {
      clearTimeout(this.vacationResultModal.autoCloseTimer);
    }
    this.vacationResultModal = {
      isOpen: false,
      success: true,
      action: null,
      employeeName: '',
      vacationType: '',
      emailSent: false
    };
    this.changeDetectorRef.detectChanges();
  }

  showVacationRequestSentModal(vacationType: string, startDate: string, endDate: string) {
    // Limpiar timer anterior si existe
    if (this.vacationRequestSentModal.autoCloseTimer) {
      clearTimeout(this.vacationRequestSentModal.autoCloseTimer);
    }

    this.vacationRequestSentModal = {
      isOpen: true,
      vacationType,
      startDate,
      endDate,
      autoCloseTimer: setTimeout(() => {
        this.closeVacationRequestSentModal();
      }, 5000)
    };
    this.changeDetectorRef.detectChanges();
  }

  showTaskEmailSentModal(taskTitle: string, employeeName: string, description: string) {
    if (this.taskEmailSentModal.autoCloseTimer) {
      clearTimeout(this.taskEmailSentModal.autoCloseTimer);
    }

    this.taskEmailSentModal = {
      isOpen: true,
      taskTitle,
      employeeName,
      description,
      autoCloseTimer: setTimeout(() => this.closeTaskEmailSentModal(), 5000)
    };
    this.changeDetectorRef.detectChanges();
  }

  closeTaskEmailSentModal() {
    if (this.taskEmailSentModal.autoCloseTimer) {
      clearTimeout(this.taskEmailSentModal.autoCloseTimer);
    }
    this.taskEmailSentModal = {
      isOpen: false,
      taskTitle: '',
      employeeName: '',
      description: ''
    };
    this.changeDetectorRef.detectChanges();
  }

  closeVacationRequestSentModal() {
    if (this.vacationRequestSentModal.autoCloseTimer) {
      clearTimeout(this.vacationRequestSentModal.autoCloseTimer);
    }
    this.vacationRequestSentModal = {
      isOpen: false,
      vacationType: '',
      startDate: '',
      endDate: '',
      autoCloseTimer: null
    };
    this.changeDetectorRef.detectChanges();
  }

  closeVacationDecisionModal() {
    this.vacationDecisionModal = {
      isOpen: false,
      requestId: null,
      action: null,
      sendEmail: false,
      emailComment: '',
      isLoading: false
    };
    this.changeDetectorRef.detectChanges();
  }

  async deleteVacationRequest(requestId: number) {
    const request = this.vacationRequests.find(r => r.id === requestId);
    if (!request) return;

    try {
      // Eliminar del calendario si estaba aprobada
      if (request.status === 'approved') {
        this.removeVacationFromCalendar(request);
      }

      await this.vacationService.delete(requestId);
      this.vacationRequests = this.vacationRequests.filter(r => r.id !== requestId);
      this.showAlert('info', 'Solicitud eliminada', 'La solicitud ha sido eliminada');
    } catch (error) {
      console.error('[CalendarComponent] Error eliminando solicitud:', error);
      this.showAlert('error', 'Error', 'No se pudo eliminar la solicitud');
    }
  }

  private addApprovedVacationsToCalendar() {
    // Eliminar eventos de vacaciones previos
    this.allEvents = this.allEvents.filter(ev => !(ev.extendedProps && ev.extendedProps.isVacation));
    const approvedRequests = this.vacationRequests.filter(r => r.status === 'approved');
    approvedRequests.forEach(request => {
      this.addVacationToCalendar(request);
    });
  }

  private addVacationToCalendar(request: VacationRequest) {
    const employee = this.employees.find(e => e.id === request.employeeId);
    const vacationColor = request.type === 'vacation' ? '#9333ea' : '#ec4899'; // Púrpura para vacaciones, rosa para días libres
    const title = request.type === 'vacation' ? `🏖️ Vacaciones - ${request.employeeName}` : `📅 Día Libre - ${request.employeeName}`;

    // Para eventos de día completo (allDay: true), FullCalendar espera que end sea el día siguiente al último día
    // Si las vacaciones son del 20 al 24, end debe ser el 25 para que muestre hasta el 24 inclusive
    const vacationEvent: CalendarEvent = {
      id: `vacation-${request.id}`,
      title,
      start: request.startDate,
      end: this.addDays(request.endDate, 1), // Sumamos 1 día porque FullCalendar usa fechas exclusivas para eventos allDay
      backgroundColor: vacationColor,
      borderColor: vacationColor,
      allDay: true,
      extendedProps: {
        calendar: 'Vacation',
        employeeId: request.employeeId,
        employeeName: request.employeeName,

        employeeColor: employee?.color,
        isVacation: true,
        vacationType: request.type
      }
    };

    this.allEvents = [...this.allEvents, vacationEvent];
    this.applyEmployeeFilter();
  }

  private removeVacationFromCalendar(request: VacationRequest) {
    this.allEvents = this.allEvents.filter(e => e.id !== `vacation-${request.id}`);
    this.applyEmployeeFilter();
  }

  private addDays(dateStr: string, days: number): string {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  }

  private isEmployeeOnVacation(employeeId: number, date: string): boolean {
    const approvedVacations = this.vacationRequests.filter(
      r => r.status === 'approved' && r.employeeId === employeeId
    );

    return approvedVacations.some(vacation => {
      const start = new Date(vacation.startDate);
      const end = new Date(vacation.endDate);
      const checkDate = new Date(date);
      return checkDate >= start && checkDate <= end;
    });
  }

  getPendingRequestsCount(): number {
    return this.vacationRequests.filter(r => r.status === 'pending').length;
  }

  get isAdmin(): boolean {
    return this.currentUser?.role === 'Administrador';
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
  }

  private formatRequestDate(dateStr: string): string {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  }

  isEmployeeAvailable(employeeId: number): boolean {
    // Si no hay fecha seleccionada, permitir todos
    if (!this.eventStartDate) return true;

    // Verificar si el empleado está de vacaciones ese día
    return !this.isEmployeeOnVacation(employeeId, this.eventStartDate);
  }

  getEmployeeVacationInfo(employeeId: number): string {
    if (!this.eventStartDate) return '';

    const approvedVacations = this.vacationRequests.filter(
      r => r.status === 'approved' && r.employeeId === employeeId
    );

    for (const vacation of approvedVacations) {
      const start = new Date(vacation.startDate);
      const end = new Date(vacation.endDate);
      const checkDate = new Date(this.eventStartDate);

      if (checkDate >= start && checkDate <= end) {
        return vacation.type === 'vacation'
          ? '🏖️ De vacaciones'
          : '📅 Día libre';
      }
    }

    return '';
  }

  onDateChange() {
    // Si hay un empleado seleccionado, verificar si sigue disponible en la nueva fecha
    if (this.eventEmployeeId && !this.isEmployeeAvailable(this.eventEmployeeId)) {
      const employeeName = this.employees.find(e => e.id === this.eventEmployeeId)?.name;
      this.showAlert(
        'warning',
        'Empleado no disponible',
        `${employeeName} no está disponible en esta fecha. Por favor, selecciona otro empleado.`
      );
      this.eventEmployeeId = undefined;
    }
  }

  // Métodos del calendario personalizado
  openStartDatePicker() {
    if (this.showStartDatePicker) {
      this.closeCalendarPickers();
    } else {
      this.showStartDatePicker = true;
      this.showEndDatePicker = false;
      this.generateCalendar();
    }
  }

  openEndDatePicker() {
    if (this.showEndDatePicker) {
      this.closeCalendarPickers();
    } else {
      this.showEndDatePicker = true;
      this.showStartDatePicker = false;
      this.generateCalendar();
    }
  }

  closeCalendarPickers() {
    this.showStartDatePicker = false;
    this.showEndDatePicker = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;

    // Verificar si el click fue dentro del contenedor de selección de fechas
    const datePickerContainer = document.querySelector('[class*="vacation-date-picker"]');
    const startDateButton = document.querySelector('[class*="start-date-button"]');
    const endDateButton = document.querySelector('[class*="end-date-button"]');

    // Si el click es fuera del selector de fechas y sus botones, cerrar
    if (this.showStartDatePicker || this.showEndDatePicker) {
      if (!target.closest('[class*="vacation-date-picker"]') &&
          !target.closest('[class*="start-date-button"]') &&
          !target.closest('[class*="end-date-button"]')) {
        this.closeCalendarPickers();
      }
    }
  }

  generateCalendar() {
    const firstDay = new Date(this.calendarYear, this.calendarMonth, 1).getDay();
    const daysInMonth = new Date(this.calendarYear, this.calendarMonth + 1, 0).getDate();

    this.calendarDays = [];

    // Ajustar para que el lunes sea el primer día (0 = domingo -> queremos 1 = lunes)
    const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1;

    // Agregar días vacíos antes del primer día del mes
    for (let i = 0; i < adjustedFirstDay; i++) {
      this.calendarDays.push(null);
    }

    // Agregar todos los días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      this.calendarDays.push(day);
    }
  }

  previousMonth() {
    if (this.calendarMonth === 0) {
      this.calendarMonth = 11;
      this.calendarYear--;
    } else {
      this.calendarMonth--;
    }
    this.generateCalendar();
  }

  nextMonth() {
    if (this.calendarMonth === 11) {
      this.calendarMonth = 0;
      this.calendarYear++;
    } else {
      this.calendarMonth++;
    }
    this.generateCalendar();
  }

  selectDate(day: number | null, isStartDate: boolean) {
    if (day === null) return;

    // Formatear la fecha manualmente para evitar problemas de zona horaria
    const year = this.calendarYear;
    const month = String(this.calendarMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const formattedDate = `${year}-${month}-${dayStr}`;

    if (isStartDate) {
      this.vacationStartDate = formattedDate;
      this.showStartDatePicker = false;
    } else {
      this.vacationEndDate = formattedDate;
      this.showEndDatePicker = false;
    }
  }

  formatDisplayDate(dateStr: string): string {
    if (!dateStr) return 'Seleccionar fecha';

    // Parsear la fecha directamente del string YYYY-MM-DD para evitar problemas de zona horaria
    const [year, month, day] = dateStr.split('-').map(Number);
    return `${day} de ${this.monthNames[month - 1]} de ${year}`;
  }

  isSelectedDate(day: number | null, dateStr: string): boolean {
    if (day === null || !dateStr) return false;

    // Comparar directamente los componentes de la fecha
    const [year, month, dayOfMonth] = dateStr.split('-').map(Number);
    return this.calendarYear === year &&
           this.calendarMonth === (month - 1) &&
           day === dayOfMonth;
  }

  isToday(day: number | null): boolean {
    if (day === null) return false;
    const today = new Date();
    return day === today.getDate() &&
           this.calendarMonth === today.getMonth() &&
           this.calendarYear === today.getFullYear();
  }

  isPastDate(day: number | null): boolean {
    if (day === null) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(this.calendarYear, this.calendarMonth, day);
    selectedDate.setHours(0, 0, 0, 0);
    return selectedDate < today;
  }

  // Verificar si faltan localizaciones por cubrir en un día
  private hasMissingLocations(date: Date): { hasMissing: boolean; count: number; missingLocations: string[] } {
    try {
      // Obtener el día de la semana directamente del objeto Date recibido
      const dayOfWeek = date.getDay(); // 0=Domingo, 1=Lunes, etc.
      const dateStr = date.toISOString().split('T')[0];

      // Log para debug
      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      console.log(`[hasMissingLocations] ${dateStr} es ${dayNames[dayOfWeek]} (dayOfWeek=${dayOfWeek})`);

      const selectedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

      // Usar this.events directamente en lugar del API de FullCalendar
      const eventsForDay = this.events.filter(ev => {
        if (!ev.start) return false;

        // Normalizar la fecha de inicio a Date
        let eventStart: Date;
        if (typeof ev.start === 'string') {
          eventStart = new Date(ev.start);
        } else if (ev.start instanceof Date) {
          eventStart = ev.start;
        } else {
          return false; // Tipo no soportado
        }

        // Si el evento tiene una fecha de fin
        if (ev.end) {
          // Normalizar la fecha de fin a Date
          let eventEnd: Date;
          if (typeof ev.end === 'string') {
            eventEnd = new Date(ev.end);
          } else if (ev.end instanceof Date) {
            eventEnd = ev.end;
          } else {
            return false; // Tipo no soportado
          }

          // Para eventos de día completo (allDay), la fecha de fin es exclusiva
          if (ev.allDay) {
            eventEnd.setDate(eventEnd.getDate() - 1);
          }

          // Verificar si la fecha seleccionada está dentro del rango del evento
          return selectedDate >= new Date(eventStart.toDateString()) &&
                 selectedDate <= new Date(eventEnd.toDateString());
        }

        // Si no hay fecha de fin, solo verificar la fecha de inicio
        const startStr = typeof ev.start === 'string'
          ? ev.start.split('T')[0]
          : (ev.start instanceof Date ? this.formatLocalDate(ev.start) : '');
        return startStr === dateStr;
      });

      // Filtrar solo tareas (no vacaciones)
      const tasks = eventsForDay.filter(ev => {
        const isVacation = ev.extendedProps['isVacation'] || false;
        return !isVacation && ev.title; // Solo contar tareas válidas
      });

      // Obtener las localizaciones que tienen tareas asignadas ese día
      const assignedLocations = new Set<number>();
      tasks.forEach(ev => {
        // Encontrar el ID de la localización basado en el nombre
        const location = this.locations.find(loc => loc.name === ev.extendedProps['location']);
        if (location) {
          assignedLocations.add(location.id);
        }
      });

      // Obtener solo las localizaciones que tienen ESTE DÍA configurado en tooltip_loc_dias
      // Soportar tanto 0 como 7 para domingo (compatibilidad con diferentes formatos de BD)
      const configuradosParaEsteDia = this.tooltipLocDays.filter(
        tooltipDay => tooltipDay.day === dayOfWeek || (dayOfWeek === 0 && tooltipDay.day === 7) || (dayOfWeek === 7 && tooltipDay.day === 0)
      );

      // Si no hay localizaciones configuradas para este día, no mostrar badge
      if (configuradosParaEsteDia.length === 0) {
        return { hasMissing: false, count: 0, missingLocations: [] };
      }

      // Verificar cuáles localizaciones configuradas para este día NO tienen tarea asignada
      const missingLocations: string[] = [];
      configuradosParaEsteDia.forEach(tooltipDay => {
        // Si esta localización NO tiene tarea asignada
        if (!assignedLocations.has(tooltipDay.locations_id)) {
          // Obtener el nombre de la localización
          const location = this.locations.find(loc => loc.id === tooltipDay.locations_id);
          if (location) {
            missingLocations.push(location.name);
          }
        }
      });

      // Logging detallado
      if (missingLocations.length > 0 || configuradosParaEsteDia.length > 0) {
        console.log(`[hasMissingLocations] ${dateStr} (día ${dayOfWeek}):`, {
          configurados: configuradosParaEsteDia.length,
          tareas: tasks.length,
          faltantes: missingLocations.length,
          missingLocations: missingLocations,
          tooltipLocDays: this.tooltipLocDays
        });
      }

      return {
        hasMissing: missingLocations.length > 0,
        count: missingLocations.length,
        missingLocations: missingLocations
      };
    } catch (error) {
      console.error('[CalendarComponent] Error en hasMissingLocations:', error);
      return { hasMissing: false, count: 0, missingLocations: [] };
    }
  }

  // Agregar indicador visual en los días donde faltan localizaciones por cubrir
  private addMissingLocationIndicator(arg: any) {
    try {
      // Solo mostrar indicador de localizaciones faltantes si el usuario es administrador
      if (!this.isAdmin) {
        return;
      }

      const dateStr = arg.date.toISOString().split('T')[0];
      const dayOfWeek = arg.date.getDay();
      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      console.log(`[addMissingLocationIndicator] Procesando celda: ${dateStr} (${dayNames[dayOfWeek]}, dayOfWeek=${dayOfWeek})`);

      const { hasMissing, count, missingLocations } = this.hasMissingLocations(arg.date);

      if (hasMissing && missingLocations.length > 0) {
        // Verificar si ya existe un badge en este elemento (evitar duplicados)
        if (arg.el.querySelector('.missing-location-badge')) {
          return;
        }

        // Buscar el elemento day-top (solo existe en vista mensual)
        let container = arg.el.querySelector('.fc-daygrid-day-top');

        // Si no se encuentra (vista semanal u otra), usar el elemento raíz
        if (!container) {
          // En vistas que no son dayGrid, usar el frame o el elemento raíz
          container = arg.el.querySelector('.fc-daygrid-day-frame') ||
                      arg.el.querySelector('.fc-timegrid-col-frame') ||
                      arg.el;
        }

        // Asegurarse de que el contenedor tenga posición relativa y permita overflow
        if (container.style) {
          container.style.position = 'relative';
          container.style.overflow = 'visible';  // Permitir que el badge no se corte
        }

        // Crear el badge (icono circular rojo con !)
        const badge = document.createElement('div');
        badge.className = 'missing-location-badge';
        badge.setAttribute('data-date', dateStr);
        badge.setAttribute('data-missing-count', count.toString());
        badge.innerHTML = '!';
        badge.style.position = 'absolute';
        badge.style.top = '4px';
        badge.style.right = '4px';
        badge.style.width = '16px';
        badge.style.height = '16px';
        badge.style.backgroundColor = '#ef4444';
        badge.style.borderRadius = '50%';
        badge.style.color = 'white';
        badge.style.fontSize = '10px';
        badge.style.fontWeight = 'bold';
        badge.style.display = 'flex';
        badge.style.alignItems = 'center';
        badge.style.justifyContent = 'center';
        badge.style.zIndex = '20';
        badge.style.cursor = 'help';
        badge.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
        badge.style.transition = 'transform 0.2s ease';
        badge.style.pointerEvents = 'auto';  // Asegurar que recibe eventos de mouse

        container.appendChild(badge);

        // Crear el contenido del tooltip con viñetas
        const locationsList = missingLocations.map(loc => `• ${loc}`).join('<br>');
        const tooltipContent = `<strong>Faltan tareas en:</strong><br>${locationsList}<br><br><small style="color: #7f1d1d; font-size: 11px; opacity: 0.8;">Crea una tarea para cubrir estas localizaciones</small>`;

        // Variable para mantener referencia al tooltip
        let tooltip: HTMLElement | null = null;
        let isTooltipVisible = false;
        let autoCloseTimer: any = null;
        let outsideClickListener: ((e: Event) => void) | null = null;
        let hideTooltipTimeout: any = null;

        // Evento mouseenter - mostrar tooltip
        const showTooltip = (e: MouseEvent | TouchEvent) => {
          e.stopPropagation(); // Prevenir que el click abra el modal
          e.stopImmediatePropagation(); // Detener todos los handlers
          if ('preventDefault' in e && typeof e.preventDefault === 'function') {
            e.preventDefault();
          }

          // Cancelar cualquier cierre pendiente
          if (hideTooltipTimeout) {
            clearTimeout(hideTooltipTimeout);
            hideTooltipTimeout = null;
          }

          // Si ya existe un tooltip visible, no crear otro
          if (tooltip && isTooltipVisible) {
            return;
          }

          isTooltipVisible = true;

          // Crear tooltip
          tooltip = document.createElement('div');
          tooltip.className = 'missing-locations-tooltip';
          tooltip.innerHTML = tooltipContent;
          tooltip.style.position = 'fixed';
          tooltip.style.zIndex = '10000';
          tooltip.style.backgroundColor = '#fee2e2';
          tooltip.style.color = '#991b1b';
          tooltip.style.padding = '12px 16px';
          tooltip.style.borderRadius = '8px';
          tooltip.style.border = '1px solid #fecaca';
          tooltip.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
          tooltip.style.minWidth = '180px';
          tooltip.style.maxWidth = '300px';
          tooltip.style.whiteSpace = 'normal';
          tooltip.style.fontSize = '13px';
          tooltip.style.lineHeight = '1.6';
          tooltip.style.pointerEvents = 'auto';
          tooltip.style.animation = 'fadeIn 0.2s ease';
          tooltip.style.userSelect = 'none';
          (tooltip.style as any).webkitUserSelect = 'none';
          tooltip.setAttribute('draggable', 'false');

          document.body.appendChild(tooltip);

          // Posicionar el tooltip encima del badge con margen
          const rect = badge.getBoundingClientRect();
          const tooltipRect = tooltip.getBoundingClientRect();

          let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
          let top = rect.top - tooltipRect.height - 12;

          // Ajustar si se sale de pantalla
          if (left < 10) {
            left = 10;
          } else if (left + tooltipRect.width > window.innerWidth - 10) {
            left = window.innerWidth - tooltipRect.width - 10;
          }

          if (top < 10) {
            top = rect.bottom + 12;
          }

          tooltip.style.left = left + 'px';
          tooltip.style.top = top + 'px';

          // Animar entrada
          tooltip.style.opacity = '0';
          setTimeout(() => {
            if (tooltip) {
              tooltip.style.opacity = '1';
              tooltip.style.transition = 'opacity 0.2s ease';
            }
          }, 10);

          // Agregar listeners directamente al tooltip cuando se crea
          if (!isTouchDevice) {
            const handleTooltipMouseEnter = () => {
              if (hideTooltipTimeout) {
                clearTimeout(hideTooltipTimeout);
                hideTooltipTimeout = null;
              }
            };

            const handleTooltipMouseLeave = () => {
              hideTooltipTimeout = setTimeout(() => {
                hideTooltip();
              }, 100);
            };

            const handleSelectStart = (e: Event) => {
              e.preventDefault();
            };

            const handleDragStart = (e: Event) => {
              e.preventDefault();
            };

            tooltip.addEventListener('mouseenter', handleTooltipMouseEnter);
            tooltip.addEventListener('mouseleave', handleTooltipMouseLeave);
            tooltip.addEventListener('selectstart', handleSelectStart);
            tooltip.addEventListener('dragstart', handleDragStart);
          }

          // Auto-cerrar después de 10 segundos
          if (autoCloseTimer) {
            clearTimeout(autoCloseTimer);
          }
          autoCloseTimer = setTimeout(() => {
            hideTooltip();
          }, 10000);

          // Agregar listener para cerrar al hacer click/touch fuera (solo si no existe uno activo)
          if (!outsideClickListener) {
            const handleOutsideClick = (event: Event) => {
              const target = event.target as HTMLElement;
              if (tooltip && isTooltipVisible && !tooltip.contains(target) && !badge.contains(target)) {
                hideTooltip();
              }
            };

            outsideClickListener = handleOutsideClick;
            document.addEventListener('click', handleOutsideClick, true);
            document.addEventListener('touchend', handleOutsideClick, true);
          }
        };

          // Evento mouseleave - ocultar tooltip con delay
        const hideTooltip = () => {
          // Limpiar el timer de auto-cierre
          if (autoCloseTimer) {
            clearTimeout(autoCloseTimer);
            autoCloseTimer = null;
          }

          // Remover el listener de click fuera
          if (outsideClickListener) {
            document.removeEventListener('click', outsideClickListener, true);
            document.removeEventListener('touchend', outsideClickListener, true);
            outsideClickListener = null;
          }

          isTooltipVisible = false;
          if (tooltip && tooltip.parentNode) {
            // Desactivar pointer-events antes de ocultar para permitir clicks debajo
            tooltip.style.pointerEvents = 'none';
            tooltip.style.opacity = '0';
            setTimeout(() => {
              if (tooltip && tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
              }
              tooltip = null;
            }, 200);
          }
        };

        // Función toggle para móvil
        const toggleTooltip = (e: Event) => {
          console.log('[CalendarComponent] toggleTooltip llamado');
          e.stopPropagation(); // Prevenir que el click abra el modal
          e.stopImmediatePropagation(); // Detener todos los handlers
          e.preventDefault();

          if (isTooltipVisible) {
            hideTooltip();
          } else {
            showTooltip(e as MouseEvent);
          }

          return false; // Prevenir comportamiento por defecto adicional
        };

        // Detectar si es dispositivo táctil
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        // Agregar eventos al badge
        if (isTouchDevice) {
          // En móvil, manejar todo en touchend
          badge.addEventListener('touchstart', (e) => {
            console.log('[CalendarComponent] touchstart en badge');
            e.stopPropagation();
            e.stopImmediatePropagation();
          }, true);

          badge.addEventListener('touchend', (e) => {
            console.log('[CalendarComponent] touchend en badge - ejecutando toggle');
            e.stopPropagation();
            e.stopImmediatePropagation();
            e.preventDefault(); // Prevenir el click sintético

            // Ejecutar toggle directamente aquí
            if (isTooltipVisible) {
              hideTooltip();
            } else {
              showTooltip(e as any);
            }
          }, true);
        } else {
          // En desktop, usar hover
          badge.addEventListener('mouseenter', showTooltip);
          badge.addEventListener('mouseleave', () => {
            // Usar un pequeño delay para permitir que el mouse entre al tooltip
            hideTooltipTimeout = setTimeout(() => {
              hideTooltip();
            }, 100);
          });
        }

        console.log(`[CalendarComponent] Badge añadido para ${dateStr} con ${count} localizaciones faltantes:`, missingLocations);
      }
    } catch (error) {
      console.error('[CalendarComponent] Error en addMissingLocationIndicator:', error);
    }
  }
}

