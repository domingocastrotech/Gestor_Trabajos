import { KeyValuePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';

import { Component, ViewChild } from '@angular/core';
import { EventInput, CalendarOptions, DateSelectArg, EventClickArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { ModalComponent } from '../../shared/components/ui/modal/modal.component';
import { AlertComponent } from '../../shared/components/ui/alert/alert.component';

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
  };
}

@Component({
  selector: 'app-calender',
  imports: [
    FormsModule,
    KeyValuePipe,
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
  }> = [];

  alerts: AlertItem[] = [];
  private alertId = 0;

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

  ngOnInit() {
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

    // Guardamos copia completa para filtrar por empleado
    this.allEvents = [...this.events];

    this.calendarOptions = {
      plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
      initialView: 'dayGridMonth',
      headerToolbar: {
        left: 'prev,next',
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
      eventContent: (arg) => this.renderEventContent(arg)
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
    }

    this.closeModal();
    this.resetModalFields();
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
    const eventsForDay = calendarApi.getEvents().filter(ev => {
      if (!ev.start) return false;
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
    }));

    this.isDayModalOpen = true;
  }

  handleDayEventEdit(eventId: string) {
    const calendarApi = this.calendarComponent.getApi();
    const ev = calendarApi.getEventById(eventId);
    if (!ev) return;

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
    if (ev) ev.remove();
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

  private showAlert(variant: AlertItem['variant'], title: string, message: string) {
    const id = ++this.alertId;
    this.alerts = [...this.alerts, { id, variant, title, message }];

    setTimeout(() => this.dismissAlert(id), 4000);
  }

  dismissAlert(id: number) {
    this.alerts = this.alerts.filter(alert => alert.id !== id);
  }
}
