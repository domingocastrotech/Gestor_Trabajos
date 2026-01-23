import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertComponent } from '../../ui/alert/alert.component';
import { LocationService, Location } from '../../../services/location.service';
import { SupabaseService } from '../../../services/supabase.service';
import { TaskService } from '../../../services/task.service';

interface LocationForm extends Omit<Location, 'id' | 'created_at'> {
  days?: number[];
}

interface AlertItem {
  id: number;
  variant: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

@Component({
  selector: 'app-location-table',
  standalone: true,
  imports: [CommonModule, FormsModule, AlertComponent],
  templateUrl: './location-table.component.html',
  styles: ``
})
export class LocationTableComponent implements OnInit {
  locations: Location[] = [];
  locationDays: Map<number, number[]> = new Map(); // Mapa de location.id -> días configurados
  form: LocationForm = this.getEmptyForm();
  daysOfWeek = [
    { num: 0, name: 'Domingo' },
    { num: 1, name: 'Lunes' },
    { num: 2, name: 'Martes' },
    { num: 3, name: 'Miércoles' },
    { num: 4, name: 'Jueves' },
    { num: 5, name: 'Viernes' },
    { num: 6, name: 'Sábado' }
  ];
    editingId: number | null = null;
    showModal = false;

    onDayCheckboxChange(dayNum: number, checked: boolean) {
      if (!Array.isArray(this.form.days)) {
        this.form.days = [];
      }
      if (checked) {
        if (!this.form.days.includes(dayNum)) {
          this.form.days.push(dayNum);
        }
      } else {
        this.form.days = this.form.days.filter(d => d !== dayNum);
      }
    }
  isLoading = false;

  alerts: AlertItem[] = [];
  private alertId = 0;

  // Modal de confirmación de borrado
  deleteConfirmation: {
    isOpen: boolean;
    locationId: number | null;
    locationName: string;
    taskCount: number;
  } = {
    isOpen: false,
    locationId: null,
    locationName: '',
    taskCount: 0
  };

  constructor(
    private locationService: LocationService,
    private taskService: TaskService,
    private supabaseService: SupabaseService
  ) {}

  ngOnInit() {
    this.loadLocations();
  }

  async loadLocations() {
    try {
      this.isLoading = true;
      this.locations = await this.locationService.getAll();

      // Cargar días para cada localización
      const { data } = await this.supabaseService.supabase
        .from('tooltip_loc_dias')
        .select('locations_id, day');

      // Agrupar días por location_id
      this.locationDays.clear();
      if (data) {
        data.forEach((item: any) => {
          if (!this.locationDays.has(item.locations_id)) {
            this.locationDays.set(item.locations_id, []);
          }
          this.locationDays.get(item.locations_id)!.push(item.day);
        });
      }

      console.log('[LocationTable] Ubicaciones cargadas:', this.locations.length);
    } catch (error: any) {
      console.error('[LocationTable] Error cargando ubicaciones:', error);
      this.showAlert('error', 'Error al cargar', 'No se pudieron cargar las ubicaciones. Verifica los permisos RLS.');
    } finally {
      this.isLoading = false;
    }
  }

  get modalTitle(): string {
    return this.editingId ? 'Editar localización' : 'Nueva localización';
  }

  startAdd() {
    this.resetForm();
    this.showModal = true;
  }

  async edit(location: Location) {
    // Obtener días asociados desde tooltip_loc_dias
    const { data, error } = await this.supabaseService.supabase
      .from('tooltip_loc_dias')
      .select('day')
      .eq('locations_id', location.id);
    const days = data ? data.map((d: any) => d.day) : [];
    this.form = { name: location.name, address: location.address, city: location.city, days };
    this.editingId = location.id;
    this.showModal = true;
  }

  async save() {
    if (!this.form.name || !this.form.address || !this.form.city) {
      this.showAlert('warning', 'Faltan datos', 'Completa todos los campos antes de guardar.');
      return;
    }

    try {
      this.isLoading = true;
      let locationId: number;
      if (this.editingId !== null) {
        // Actualizar localización solo con los campos válidos
        const { name, address, city } = this.form;
        await this.locationService.update(this.editingId, { name, address, city });
        locationId = this.editingId;
        // Eliminar días anteriores
        await this.supabaseService.supabase
          .from('tooltip_loc_dias')
          .delete()
          .eq('locations_id', locationId);
      } else {
        // Crear localización
        // Extraer solo los campos válidos para la tabla locations
        const { name, address, city } = this.form;
        const loc = await this.locationService.create({ name, address, city });
        locationId = loc.id;
      }
      // Insertar días seleccionados en tooltip_loc_dias
      if (Array.isArray(this.form.days) && this.form.days.length > 0) {
        const insertRows = this.form.days.map(day => ({ locations_id: locationId, day }));
        await this.supabaseService.supabase
          .from('tooltip_loc_dias')
          .insert(insertRows);
      }
      this.showAlert('success', 'Localización guardada', `${this.form.name} se guardó correctamente.`);
      await this.loadLocations();
      this.closeModal();
    } catch (error: any) {
      console.error('[LocationTable] Error guardando:', error);
      this.showAlert('error', 'Error al guardar', error.message || 'No se pudo guardar la localización.');
    } finally {
      this.isLoading = false;
    }
  }

  remove(id: number) {
    const location = this.locations.find(loc => loc.id === id);
    if (location) {
      this.openDeleteConfirmation(id, location.name);
    }
  }

  async openDeleteConfirmation(id: number, name: string) {
    try {
      // Verificar si hay tareas con esta localización
      const allTasks = await this.taskService.getAll();
      const tasksInLocation = allTasks.filter(task => task.location_id === id);
      const taskCount = tasksInLocation.length;

      this.deleteConfirmation = {
        isOpen: true,
        locationId: id,
        locationName: name,
        taskCount: taskCount
      };
    } catch (error) {
      console.error('[LocationTable] Error verificando tareas:', error);
      // Continuar con la eliminación sin contar tareas
      this.deleteConfirmation = {
        isOpen: true,
        locationId: id,
        locationName: name,
        taskCount: 0
      };
    }
  }

  closeDeleteConfirmation() {
    this.deleteConfirmation = {
      isOpen: false,
      locationId: null,
      locationName: '',
      taskCount: 0
    };
  }

  confirmDelete() {
    if (this.deleteConfirmation.locationId === null) return;

    const id = this.deleteConfirmation.locationId;
    const name = this.deleteConfirmation.locationName;

    (async () => {
      try {
        this.isLoading = true;
        await this.locationService.delete(id);
        this.showAlert('success', 'Localización eliminada', `"${name}" fue eliminada correctamente.`);
        await this.loadLocations();

        if (this.editingId === id) {
          this.resetForm();
        }

        this.closeDeleteConfirmation();
      } catch (error: any) {
        console.error('[LocationTable] Error eliminando:', error);
        this.showAlert('error', 'Error al eliminar', error.message || 'No se pudo eliminar la localización.');
      } finally {
        this.isLoading = false;
      }
    })();
  }

  closeModal() {
    this.showModal = false;
    this.resetForm();
  }

  private resetForm() {
    this.form = this.getEmptyForm();
    this.editingId = null;
  }

  private getEmptyForm(): LocationForm {
    return { name: '', address: '', city: '', days: [] };
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
   * Obtiene los nombres de los días configurados para una localización
   */
  getLocationDaysText(locationId: number): string {
    const days = this.locationDays.get(locationId);
    if (!days || days.length === 0) {
      return 'Sin días configurados';
    }

    // Ordenar los días
    const sortedDays = [...days].sort((a, b) => a - b);

    // Mapear números a nombres
    const dayNames = sortedDays.map(dayNum => {
      const day = this.daysOfWeek.find(d => d.num === dayNum);
      return day ? day.name.substring(0, 3) : '';
    }).filter(name => name !== '');

    return dayNames.join(', ');
  }
}
