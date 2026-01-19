import { KeyValuePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';

import { Component, ViewChild } from '@angular/core';
import { EventInput, CalendarOptions, DateSelectArg, EventClickArg } from '@fullcalendar/core';
import esLocale from '@fullcalendar/core/locales/es';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { AlertComponent } from '../../shared/components/ui/alert/alert.component';
import { NotificationService } from '../../shared/services/notification.service';

interface Employee {
  id: number;
  name: string;
  email: string;
  avatar: string;
  color: string;
  rol: 'Administrador' | 'Usuario';
}

interface Location {
  id: number;
  name: string;
  address: string;
  city: string;
  phone: string;
}

interface AlertItem {
  id: number;
  variant: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

interface VacationRequest {
  id: number;
  employeeId: number;
  employeeName: string;
  employeeAvatar: string;
  startDate: string;
  endDate: string;
  type: 'vacation' | 'day-off';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestDate: string;
}

interface CalendarEvent extends EventInput {
  extendedProps: {
    calendar: string;
    location?: string;
    employeeId?: number;
    employeeName?: string;
    employeeAvatar?: string;
    employeeColor?: string;
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

  @ViewChild('calendar') calendarComponent!: FullCalendarComponent;

  events: CalendarEvent[] = [];
  allEvents: CalendarEvent[] = [];
  selectedEvent: CalendarEvent | null = null;
  eventTitle = '';
  eventStartDate = '';
  eventEndDate = '';
  eventLevel = '';
  eventLocation = '';
  eventEmployeeId: number | undefined = undefined;
  eventStartTime = '09:00';
  eventEndTime = '17:00';
  isOpen = false;

  // Control de conflictos
  conflictEvent: any = null;
  showConflictModal = false;
  pendingEventData: any = null;

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
    employeeAvatar?: string;
    employeeColor?: string;
    startTime?: string;
    endTime?: string;
    isVacation?: boolean;
    vacationType?: 'vacation' | 'day-off';
  }> = [];

  alerts: AlertItem[] = [];
  private alertId = 0;

  // Sistema de vacaciones
  vacationRequests: VacationRequest[] = [];
  isVacationModalOpen = false;
  isVacationManagementOpen = false;
  vacationStartDate = '';
  vacationEndDate = '';
  vacationType: 'vacation' | 'day-off' = 'vacation';
  vacationReason = '';
  currentUser: Employee | null = null; // Simular usuario actual

  // Calendario personalizado
  showStartDatePicker = false;
  showEndDatePicker = false;
  calendarMonth = new Date().getMonth();
  calendarYear = new Date().getFullYear();
  calendarDays: (number | null)[] = [];
  monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

  locations: Location[] = [
    { id: 1, name: 'Sede Central', address: 'Av. Principal 123', city: 'Madrid', phone: '+34 910 000 001' },
    { id: 2, name: 'Oficina Norte', address: 'Calle Norte 45', city: 'Bilbao', phone: '+34 944 000 002' },
    { id: 3, name: 'Centro Operativo', address: 'Gran Vía 210', city: 'Barcelona', phone: '+34 933 000 003' },
  ];

  employees: Employee[] = [
    {
      id: 1,
      name: 'Ana García',
      email: 'ana.garcia@empresa.com',
      avatar: '/images/user/user-01.png',
      color: '#10b981',
      rol: 'Administrador',
    },
    {
      id: 2,
      name: 'Luis Pérez',
      email: 'luis.perez@empresa.com',
      avatar: '/images/user/user-02.png',
      color: '#6366f1',
      rol: 'Usuario',
    },
    {
      id: 3,
      name: 'María López',
      email: 'maria.lopez@empresa.com',
      avatar: '/images/user/user-03.png',
      color: '#f97316',
      rol: 'Usuario',
    },
  ];

  calendarsEvents: Record<string, string> = {
    Danger: 'danger',
    Success: 'success',
    Primary: 'primary',
    Warning: 'warning'
  };

  calendarOptions!: CalendarOptions;

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    // Simular usuario actual (Ana García como administradora)
    this.currentUser = this.employees[0];

    // Inicializar solicitudes de vacaciones de ejemplo
    this.vacationRequests = [
      {
        id: 1,
        employeeId: 2,
        employeeName: 'Luis Pérez',
        employeeAvatar: '/images/user/user-02.png',
        startDate: '2026-01-20',
        endDate: '2026-01-24',
        type: 'vacation',
        reason: 'Vacaciones de invierno',
        status: 'pending',
        requestDate: '2026-01-10'
      },
      {
        id: 2,
        employeeId: 3,
        employeeName: 'María López',
        employeeAvatar: '/images/user/user-03.png',
        startDate: '2026-01-18',
        endDate: '2026-01-18',
        type: 'day-off',
        reason: 'Asuntos personales',
        status: 'approved',
        requestDate: '2026-01-12'
      }
    ];

    // Agregar notificaciones de ejemplo para demostrar el sistema
    // Si hay solicitudes pendientes, notificar al admin
    const pendingRequests = this.vacationRequests.filter(r => r.status === 'pending');
    if (this.isAdmin && pendingRequests.length > 0) {
      pendingRequests.forEach(request => {
        this.notificationService.addNotification({
          type: 'vacation-request',
          title: 'Nueva solicitud de vacaciones',
          message: `${request.employeeName} ha solicitado ${request.type === 'vacation' ? 'vacaciones' : 'un día libre'} del ${this.formatDate(request.startDate)} al ${this.formatDate(request.endDate)}`,
          avatar: request.employeeAvatar,
          employeeName: request.employeeName,
          data: { requestId: request.id }
        });
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const twoDays = new Date(Date.now() + 172800000).toISOString().split('T')[0];
    const targetDate = '2026-01-15';

    this.events = [
      {
        id: '1',
        title: 'Event Conf.',
        start: today,
        backgroundColor: '#10b981',
        borderColor: '#10b981',
        extendedProps: {
          calendar: 'Danger',
          location: 'Sede Central',
          employeeId: 1,
          employeeName: 'Ana García',
          employeeAvatar: '/images/user/user-01.png',
          employeeColor: '#10b981',
          startTime: '09:00',
          endTime: '11:00'
        }
      },
      // Lote de tareas para el 15
      {
        id: 't1',
        title: 'Tarea 1 - Ana García',
        start: targetDate,
        backgroundColor: '#10b981',
        borderColor: '#10b981',
        extendedProps: {
          calendar: 'Primary',
          location: 'Sede Central',
          employeeId: 1,
          employeeName: 'Ana García',
          employeeAvatar: '/images/user/user-01.png',
          employeeColor: '#10b981',
          startTime: '09:00',
          endTime: '10:00'
        }
      },
      {
        id: 't2',
        title: 'Tarea 2 - Luis Pérez',
        start: targetDate,
        backgroundColor: '#6366f1',
        borderColor: '#6366f1',
        extendedProps: {
          calendar: 'Primary',
          location: 'Oficina Norte',
          employeeId: 2,
          employeeName: 'Luis Pérez',
          employeeAvatar: '/images/user/user-02.png',
          employeeColor: '#6366f1',
          startTime: '10:00',
          endTime: '11:00'
        }
      },
      {
        id: 't3',
        title: 'Tarea 3 - María López',
        start: targetDate,
        backgroundColor: '#f97316',
        borderColor: '#f97316',
        extendedProps: {
          calendar: 'Primary',
          location: 'Centro Operativo',
          employeeId: 3,
          employeeName: 'María López',
          employeeAvatar: '/images/user/user-03.png',
          employeeColor: '#f97316',
          startTime: '11:00',
          endTime: '12:00'
        }
      },
      {
        id: 't4',
        title: 'Tarea 4 - Ana García',
        start: targetDate,
        backgroundColor: '#10b981',
        borderColor: '#10b981',
        extendedProps: {
          calendar: 'Primary',
          location: 'Sede Central',
          employeeId: 1,
          employeeName: 'Ana García',
          employeeAvatar: '/images/user/user-01.png',
          employeeColor: '#10b981',
          startTime: '12:00',
          endTime: '13:00'
        }
      },
      {
        id: 't5',
        title: 'Tarea 5 - Luis Pérez',
        start: targetDate,
        backgroundColor: '#6366f1',
        borderColor: '#6366f1',
        extendedProps: {
          calendar: 'Primary',
          location: 'Oficina Norte',
          employeeId: 2,
          employeeName: 'Luis Pérez',
          employeeAvatar: '/images/user/user-02.png',
          employeeColor: '#6366f1',
          startTime: '13:00',
          endTime: '14:00'
        }
      },
      {
        id: 't6',
        title: 'Tarea 6 - María López',
        start: targetDate,
        backgroundColor: '#f97316',
        borderColor: '#f97316',
        extendedProps: {
          calendar: 'Primary',
          location: 'Centro Operativo',
          employeeId: 3,
          employeeName: 'María López',
          employeeAvatar: '/images/user/user-03.png',
          employeeColor: '#f97316',
          startTime: '14:00',
          endTime: '15:00'
        }
      },
      {
        id: 't7',
        title: 'Tarea 7 - Ana García',
        start: targetDate,
        backgroundColor: '#10b981',
        borderColor: '#10b981',
        extendedProps: {
          calendar: 'Primary',
          location: 'Sede Central',
          employeeId: 1,
          employeeName: 'Ana García',
          employeeAvatar: '/images/user/user-01.png',
          employeeColor: '#10b981',
          startTime: '15:00',
          endTime: '16:00'
        }
      },
      {
        id: 't8',
        title: 'Tarea 8 - Luis Pérez',
        start: targetDate,
        backgroundColor: '#6366f1',
        borderColor: '#6366f1',
        extendedProps: {
          calendar: 'Primary',
          location: 'Oficina Norte',
          employeeId: 2,
          employeeName: 'Luis Pérez',
          employeeAvatar: '/images/user/user-02.png',
          employeeColor: '#6366f1',
          startTime: '16:00',
          endTime: '17:00'
        }
      },
      {
        id: 't9',
        title: 'Tarea 9 - María López',
        start: targetDate,
        backgroundColor: '#f97316',
        borderColor: '#f97316',
        extendedProps: {
          calendar: 'Primary',
          location: 'Centro Operativo',
          employeeId: 3,
          employeeName: 'María López',
          employeeAvatar: '/images/user/user-03.png',
          employeeColor: '#f97316',
          startTime: '17:00',
          endTime: '18:00'
        }
      },
      {
        id: 't10',
        title: 'Tarea 10 - Ana García',
        start: targetDate,
        backgroundColor: '#10b981',
        borderColor: '#10b981',
        extendedProps: {
          calendar: 'Primary',
          location: 'Sede Central',
          employeeId: 1,
          employeeName: 'Ana García',
          employeeAvatar: '/images/user/user-01.png',
          employeeColor: '#10b981',
          startTime: '18:00',
          endTime: '19:00'
        }
      },
      {
        id: '2',
        title: 'Meeting',
        start: tomorrow,
        backgroundColor: '#6366f1',
        borderColor: '#6366f1',
        extendedProps: {
          calendar: 'Success',
          location: 'Oficina Norte',
          employeeId: 2,
          employeeName: 'Luis Pérez',
          employeeAvatar: '/images/user/user-02.png',
          employeeColor: '#6366f1',
          startTime: '10:00',
          endTime: '12:00'
        }
      },
      {
        id: '3',
        title: 'Workshop',
        start: twoDays,
        backgroundColor: '#f97316',
        borderColor: '#f97316',
        extendedProps: {
          calendar: 'Primary',
          location: 'Centro Operativo',
          employeeId: 3,
          employeeName: 'María López',
          employeeAvatar: '/images/user/user-03.png',
          employeeColor: '#f97316',
          startTime: '14:00',
          endTime: '16:00'
        }
      }
    ];

    // Agregar vacaciones aprobadas al calendario
    this.addApprovedVacationsToCalendar();

    // Guardamos copia completa para filtrar por empleado
    this.allEvents = [...this.events];

    // Personalización de localización con meses en mayúscula
    const esLocaleCustom = {
      ...esLocale,
      monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
      monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    };

    this.calendarOptions = {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: 'dayGridMonth',
      locale: esLocaleCustom,
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      selectable: true,
      events: this.events,
      select: (info) => this.handleDateSelect(info),
      eventClick: (info) => this.handleEventClick(info),
      dateClick: (info) => this.handleDayClick(info.dateStr, info.allDay),
      dayMaxEventRows: 3,
      moreLinkContent: () => ({ html: '<span class="fc-more-text">+ Más tareas</span>' }),
      moreLinkClick: (args) => {
        this.openDayEventsModal(args.date.toISOString().split('T')[0]);
        return 'none';
      },
      eventContent: (arg) => this.renderEventContent(arg),
      dayCellDidMount: (arg) => this.addMissingLocationIndicator(arg)
    };
  }

  handleDateSelect(selectInfo: DateSelectArg) {
    // Siempre mostrar el modal de lista de tareas del día
    this.openDayEventsModal(selectInfo.startStr);
  }

  handleDayClick(dateStr: string, allDay: boolean) {
    // Siempre mostrar el modal de lista de tareas del día
    this.openDayEventsModal(dateStr);
  }

  handleEventClick(clickInfo: EventClickArg) {
    const event = clickInfo.event as any;

    // Si es una vacación, no permitir edición (solo desde gestión de solicitudes)
    if (event.extendedProps['isVacation']) {
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
        employeeAvatar: event.extendedProps['employeeAvatar'],
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
    this.openModal();
  }

  handleAddOrUpdateEvent() {
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

    // Proceder con la creación/actualización del evento
    this.proceedWithEventCreation();
  }

  proceedWithEventCreation() {
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

    const eventColor = employee?.color || '#6366f1';
    const calendarApi = this.calendarComponent.getApi();

    if (this.selectedEvent) {
      // Editar evento existente - Remover y recrear para forzar renderizado correcto
      const eventToRemove = calendarApi.getEventById(this.selectedEvent.id!);
      if (eventToRemove) {
        eventToRemove.remove();
      }

      const updatedEvent = {
        id: this.selectedEvent.id,
        title: generatedTitle,
        start: this.eventStartDate,
        end: this.eventEndDate,
        backgroundColor: eventColor,
        borderColor: eventColor,
        extendedProps: {
          calendar: 'Primary',
          location: this.eventLocation,
          employeeId: this.eventEmployeeId,
          employeeName: employee?.name,
          employeeAvatar: employee?.avatar,
          employeeColor: employee?.color,
          startTime: this.eventStartTime,
          endTime: this.eventEndTime
        }
      };

      // Actualizar en los arrays locales y en el calendario
      this.allEvents = this.allEvents.map(ev =>
        ev.id === this.selectedEvent!.id ? updatedEvent : ev
      );
      this.applyEmployeeFilter();
    } else {
      // Crear nuevo evento usando la API de FullCalendar
      const newEvent = {
        id: Date.now().toString(),
        title: generatedTitle,
        start: this.eventStartDate,
        end: this.eventEndDate,
        backgroundColor: eventColor,
        borderColor: eventColor,
        extendedProps: {
          calendar: 'Primary',
          location: this.eventLocation,
          employeeId: this.eventEmployeeId,
          employeeName: employee?.name,
          employeeAvatar: employee?.avatar,
          employeeColor: employee?.color,
          startTime: this.eventStartTime,
          endTime: this.eventEndTime
        }
      };
      this.allEvents = [...this.allEvents, newEvent];
      this.applyEmployeeFilter();

      // Enviar notificación al empleado asignado
      if (employee && this.currentUser && employee.id !== this.currentUser.id) {
        this.notificationService.addNotification({
          type: 'task',
          title: `Nueva tarea asignada`,
          message: `${this.currentUser.name} te ha asignado una tarea: "${generatedTitle}"`,
          avatar: this.currentUser.avatar,
          employeeName: this.currentUser.name,
          data: { eventId: newEvent.id }
        });
      }
    }

    this.closeModal();
    this.resetModalFields();
    this.showAlert('success', 'Tarea creada', 'La tarea se ha registrado correctamente');
  }

  rejectEventCreation() {
    this.showConflictModal = false;
    this.conflictEvent = null;
    this.pendingEventData = null;
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
      employeeAvatar: ev.extendedProps['employeeAvatar'],
      employeeColor: ev.extendedProps['employeeColor'],
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
        employeeAvatar: ev.extendedProps['employeeAvatar'],
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

    ev.remove();
    this.events = this.events.filter(e => e.id !== eventId);
    if (this.selectedDay) {
      this.openDayEventsModal(this.selectedDay);
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
    const avatar = eventInfo.event.extendedProps.employeeAvatar;
    const employeeName = eventInfo.event.extendedProps.employeeName;
    const location = eventInfo.event.extendedProps.location;
    const startTime = eventInfo.event.extendedProps.startTime;
    const endTime = eventInfo.event.extendedProps.endTime;
    const timeText = startTime && endTime ? `${startTime}-${endTime}` : '';
    const bgColor = eventInfo.event.backgroundColor || '#6366f1';
    const isVacation = eventInfo.event.extendedProps.isVacation;
    const vacationType = eventInfo.event.extendedProps.vacationType;

    // Renderizado especial para vacaciones
    if (isVacation) {
      const icon = vacationType === 'vacation' ? '🏖️' : '📅';
      return {
        html: `
          <div class="flex items-center justify-center gap-1 p-2 text-xs font-bold" style="background-color: ${bgColor}; border-radius: 4px; color: white;">
            <span style="font-size: 16px;">${icon}</span>
            ${avatar ? `<img src="${avatar}" alt="${employeeName}" class="w-4 h-4 rounded-full object-cover flex-shrink-0" referrerpolicy="no-referrer" />` : ''}
            <span class="truncate">${eventInfo.event.title}</span>
          </div>
        `
      };
    }

    // Renderizado normal para tareas
    return {
      html: `
        <div class="flex flex-col gap-0.5 p-1 text-xs" style="background-color: ${bgColor}; border-radius: 4px; color: white;">
          <div class="flex items-center gap-1 min-h-[20px]">
            ${avatar ? `<img src="${avatar}" alt="${employeeName}" class="w-4 h-4 rounded-full object-cover flex-shrink-0" referrerpolicy="no-referrer" />` : ''}
            <span class="font-semibold truncate">${employeeName || 'Tarea'}</span>
          </div>
          ${location ? `<div class="truncate text-white/90">📍 ${location}</div>` : ''}
          ${timeText ? `<div class="truncate text-white/90">🕐 ${timeText}</div>` : ''}
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
      if (event.id === this.selectedEvent?.id) {
        return false; // Ignorar el evento actual si lo estamos editando
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
      const startDate = new Date(event.start as string);
      const endDate = event.end ? new Date(event.end as string) : new Date(startDate.getTime() + 3600000); // 1 hora por defecto

      // Formatear fechas en formato iCalendar (YYYYMMDDTHHMMSS)
      const formatDate = (date: Date) => {
        return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      icsContent.push('BEGIN:VEVENT');
      icsContent.push(`DTSTART:${formatDate(startDate)}`);
      icsContent.push(`DTEND:${formatDate(endDate)}`);
      icsContent.push(`SUMMARY:${event.title || 'Tarea'}`);

      if (event.extendedProps.location) {
        icsContent.push(`LOCATION:${event.extendedProps.location}`);
      }

      if (event.extendedProps.employeeName) {
        const description = `Empleado: ${event.extendedProps.employeeName}\\nLocalización: ${event.extendedProps.location || 'N/A'}`;
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

  openVacationManagement() {
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

  submitVacationRequest() {
    if (!this.vacationStartDate || !this.vacationEndDate || !this.vacationReason.trim()) {
      this.showAlert('warning', 'Campos incompletos', 'Debes completar todos los campos para solicitar vacaciones');
      return;
    }

    if (!this.currentUser) return;

    const newRequest: VacationRequest = {
      id: this.vacationRequests.length + 1,
      employeeId: this.currentUser.id,
      employeeName: this.currentUser.name,
      employeeAvatar: this.currentUser.avatar,
      startDate: this.vacationStartDate,
      endDate: this.vacationEndDate,
      type: this.vacationType,
      reason: this.vacationReason,
      status: 'pending',
      requestDate: new Date().toISOString().split('T')[0]
    };

    this.vacationRequests = [...this.vacationRequests, newRequest];

    // Enviar notificación a todos los administradores
    if (this.currentUser) {
      const admins = this.employees.filter(emp => emp.rol === 'Administrador');
      admins.forEach(admin => {
        this.notificationService.addNotification({
          type: 'vacation-request',
          title: 'Nueva solicitud de vacaciones',
          message: `${this.currentUser!.name} ha solicitado ${this.vacationType === 'vacation' ? 'vacaciones' : 'un día libre'} del ${this.formatDate(this.vacationStartDate)} al ${this.formatDate(this.vacationEndDate)}`,
          avatar: this.currentUser!.avatar,
          employeeName: this.currentUser!.name,
          data: { requestId: newRequest.id }
        });
      });
    }

    this.showAlert('success', 'Solicitud enviada', 'Tu solicitud de vacaciones ha sido enviada al administrador');
    this.closeVacationModal();
  }

  approveVacationRequest(requestId: number) {
    const request = this.vacationRequests.find(r => r.id === requestId);
    if (!request) return;

    request.status = 'approved';
    this.addVacationToCalendar(request);

    // Notificar al empleado
    if (this.currentUser) {
      this.notificationService.addNotification({
        type: 'vacation-request',
        title: 'Solicitud aprobada',
        message: `Tu solicitud de ${request.type === 'vacation' ? 'vacaciones' : 'día libre'} del ${this.formatDate(request.startDate)} al ${this.formatDate(request.endDate)} ha sido aprobada`,
        avatar: this.currentUser.avatar,
        employeeName: 'Administrador',
        data: { requestId: request.id }
      });
    }

    this.showAlert('success', 'Solicitud aprobada', `La solicitud de ${request.employeeName} ha sido aprobada`);
  }

  rejectVacationRequest(requestId: number) {
    const request = this.vacationRequests.find(r => r.id === requestId);
    if (!request) return;

    request.status = 'rejected';

    // Notificar al empleado
    if (this.currentUser) {
      this.notificationService.addNotification({
        type: 'vacation-request',
        title: 'Solicitud rechazada',
        message: `Tu solicitud de ${request.type === 'vacation' ? 'vacaciones' : 'día libre'} del ${this.formatDate(request.startDate)} al ${this.formatDate(request.endDate)} ha sido rechazada`,
        avatar: this.currentUser.avatar,
        employeeName: 'Administrador',
        data: { requestId: request.id }
      });
    }

    this.showAlert('info', 'Solicitud rechazada', `La solicitud de ${request.employeeName} ha sido rechazada`);
  }

  deleteVacationRequest(requestId: number) {
    const request = this.vacationRequests.find(r => r.id === requestId);
    if (!request) return;

    // Eliminar del calendario si estaba aprobada
    if (request.status === 'approved') {
      this.removeVacationFromCalendar(request);
    }

    this.vacationRequests = this.vacationRequests.filter(r => r.id !== requestId);
    this.showAlert('info', 'Solicitud eliminada', 'La solicitud ha sido eliminada');
  }

  private addApprovedVacationsToCalendar() {
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
        employeeAvatar: request.employeeAvatar,
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
    return this.currentUser?.rol === 'Administrador';
  }

  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
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
    this.showStartDatePicker = true;
    this.showEndDatePicker = false;
    this.generateCalendar();
  }

  openEndDatePicker() {
    this.showEndDatePicker = true;
    this.showStartDatePicker = false;
    this.generateCalendar();
  }

  closeCalendarPickers() {
    this.showStartDatePicker = false;
    this.showEndDatePicker = false;
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

  // Verificar si faltan localizaciones por cubrir en un día
  private hasMissingLocations(dateStr: string): { hasMissing: boolean; count: number; missingLocations: string[] } {
    const calendarApi = this.calendarComponent?.getApi();
    if (!calendarApi) return { hasMissing: false, count: 0, missingLocations: [] };

    const selectedDate = new Date(dateStr + 'T00:00:00');

    const eventsForDay = calendarApi.getEvents().filter(ev => {
      if (!ev.start) return false;

      const eventStart = new Date(ev.start);

      // Si el evento tiene una fecha de fin
      if (ev.end) {
        const eventEnd = new Date(ev.end);
        // Para eventos de día completo (allDay), la fecha de fin es exclusiva
        if (ev.allDay) {
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

    // Filtrar solo tareas (no vacaciones)
    const tasks = eventsForDay.filter(ev => {
      const isVacation = ev.extendedProps['isVacation'] || false;
      return !isVacation;
    });

    // Obtener las localizaciones que tienen tareas asignadas ese día
    const assignedLocations = new Set<string>();
    tasks.forEach(ev => {
      const location = ev.extendedProps['location'];
      if (location && location.trim() !== '') {
        assignedLocations.add(location);
      }
    });

    // Obtener todas las localizaciones disponibles
    const allLocationNames = this.locations.map(loc => loc.name);

    // Encontrar las localizaciones que NO tienen tareas asignadas
    const missingLocations = allLocationNames.filter(loc => !assignedLocations.has(loc));

    return {
      hasMissing: missingLocations.length > 0,
      count: missingLocations.length,
      missingLocations: missingLocations
    };
  }

  // Agregar indicador visual en los días donde faltan localizaciones por cubrir
  private addMissingLocationIndicator(arg: any) {
    const dateStr = arg.date.toISOString().split('T')[0];
    const { hasMissing, count, missingLocations } = this.hasMissingLocations(dateStr);

    if (hasMissing) {
      // Buscar el elemento day-top para agregar el badge
      const dayTop = arg.el.querySelector('.fc-daygrid-day-top');
      if (!dayTop) {
        return;
      }

      // Crear el badge (icono circular rojo con !)
      const badge = document.createElement('div');
      badge.className = 'missing-location-badge';
      badge.innerHTML = '!';
      badge.style.position = 'absolute';
      badge.style.top = '4px';
      badge.style.right = '4px';
      badge.style.width = '14px';
      badge.style.height = '14px';
      badge.style.backgroundColor = '#ef4444';
      badge.style.borderRadius = '50%';
      badge.style.color = 'white';
      badge.style.fontSize = '9px';
      badge.style.fontWeight = 'bold';
      badge.style.display = 'flex';
      badge.style.alignItems = 'center';
      badge.style.justifyContent = 'center';
      badge.style.zIndex = '10';
      badge.style.cursor = 'help';
      badge.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';

      dayTop.appendChild(badge);

      // Crear el contenido del tooltip con viñetas
      const locationsList = missingLocations.map(loc => `• ${loc}`).join('<br>');
      const tooltipContent = '<strong>Faltan tareas:</strong><br>' + locationsList;

      // Variable para mantener referencia al tooltip
      let tooltip: HTMLElement | null = null;

      // Evento mouseenter solo en el badge - mostrar tooltip
      badge.addEventListener('mouseenter', (e: MouseEvent) => {
        // Crear tooltip
        tooltip = document.createElement('div');
        tooltip.className = 'missing-locations-tooltip';
        tooltip.innerHTML = tooltipContent;
        tooltip.style.position = 'fixed';
        tooltip.style.zIndex = '99999';
        tooltip.style.backgroundColor = '#fee2e2';
        tooltip.style.color = '#991b1b';
        tooltip.style.padding = '12px 16px';
        tooltip.style.borderRadius = '8px';
        tooltip.style.border = '1px solid #fecaca';
        tooltip.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.5)';
        tooltip.style.minWidth = '180px';

        document.body.appendChild(tooltip);

        // Posicionar el tooltip encima del badge
        const rect = badge.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();

        const left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
        const top = rect.top - tooltipRect.height - 12;

        tooltip.style.left = Math.max(10, left) + 'px';
        tooltip.style.top = Math.max(10, top) + 'px';
      });

      // Evento mouseleave del badge - ocultar tooltip
      badge.addEventListener('mouseleave', () => {
        if (tooltip && tooltip.parentNode) {
          tooltip.parentNode.removeChild(tooltip);
          tooltip = null;
        }
      });
    }
  }
}

