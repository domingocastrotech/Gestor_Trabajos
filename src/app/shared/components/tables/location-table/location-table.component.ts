import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertComponent } from '../../ui/alert/alert.component';

interface Office {
  id: number;
  name: string;
  address: string;
  city: string;
  phone: string;
}

interface OfficeForm extends Omit<Office, 'id'> {}

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
export class LocationTableComponent {
  offices: Office[] = [
    { id: 1, name: 'Sede Central', address: 'Av. Principal 123', city: 'Madrid', phone: '+34 910 000 001' },
    { id: 2, name: 'Oficina Norte', address: 'Calle Norte 45', city: 'Bilbao', phone: '+34 944 000 002' },
    { id: 3, name: 'Centro Operativo', address: 'Gran Vía 210', city: 'Barcelona', phone: '+34 933 000 003' },
  ];

  form: OfficeForm = this.getEmptyForm();
  editingId: number | null = null;
  showModal = false;

  alerts: AlertItem[] = [];
  private alertId = 0;

  get modalTitle(): string {
    return this.editingId ? 'Editar administración' : 'Nueva administración';
  }

  startAdd() {
    this.resetForm();
    this.showModal = true;
  }

  edit(office: Office) {
    this.form = { name: office.name, address: office.address, city: office.city, phone: office.phone };
    this.editingId = office.id;
    this.showModal = true;
  }

  save() {
    if (!this.form.name || !this.form.address || !this.form.city || !this.form.phone) {
      this.showAlert('warning', 'Faltan datos', 'Completa todos los campos antes de guardar.');
      return;
    }

    if (this.editingId !== null) {
      this.offices = this.offices.map(o => (o.id === this.editingId ? { ...o, ...this.form } : o));
      this.showAlert('success', 'Administración actualizada', `${this.form.name} ha sido actualizada.`);
    } else {
      const nextId = Math.max(0, ...this.offices.map(o => o.id)) + 1;
      this.offices = [...this.offices, { ...this.form, id: nextId }];
      this.showAlert('success', 'Administración agregada', `${this.form.name} se añadió correctamente.`);
    }

    this.closeModal();
  }

  remove(id: number) {
    const removed = this.offices.find(o => o.id === id);
    this.offices = this.offices.filter(o => o.id !== id);
    if (removed) {
      this.showAlert('warning', 'Administración eliminada', `${removed.name} fue eliminada.`);
    }

    if (this.editingId === id) {
      this.resetForm();
    }
  }

  closeModal() {
    this.showModal = false;
    this.resetForm();
  }

  private resetForm() {
    this.form = this.getEmptyForm();
    this.editingId = null;
  }

  private getEmptyForm(): OfficeForm {
    return { name: '', address: '', city: '', phone: '' };
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
