import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertComponent } from '../../ui/alert/alert.component';
import { LocationService, Location } from '../../../services/location.service';

interface LocationForm extends Omit<Location, 'id' | 'created_at'> {}

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
  form: LocationForm = this.getEmptyForm();
  editingId: number | null = null;
  showModal = false;
  isLoading = false;

  alerts: AlertItem[] = [];
  private alertId = 0;

  // Modal de confirmación de borrado
  deleteConfirmation: { isOpen: boolean; locationId: number | null; locationName: string } = {
    isOpen: false,
    locationId: null,
    locationName: ''
  };

  constructor(private locationService: LocationService) {}

  ngOnInit() {
    this.loadLocations();
  }

  async loadLocations() {
    try {
      this.isLoading = true;
      this.locations = await this.locationService.getAll();
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

  edit(location: Location) {
    this.form = { name: location.name, address: location.address, city: location.city };
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

      if (this.editingId !== null) {
        // Actualizar
        await this.locationService.update(this.editingId, this.form);
        this.showAlert('success', 'Localización actualizada', `${this.form.name} ha sido actualizada.`);
      } else {
        // Crear
        await this.locationService.create(this.form);
        this.showAlert('success', 'Localización agregada', `${this.form.name} se añadió correctamente.`);
      }

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

  openDeleteConfirmation(id: number, name: string) {
    this.deleteConfirmation = {
      isOpen: true,
      locationId: id,
      locationName: name
    };
  }

  closeDeleteConfirmation() {
    this.deleteConfirmation = {
      isOpen: false,
      locationId: null,
      locationName: ''
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
    return { name: '', address: '', city: '' };
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
