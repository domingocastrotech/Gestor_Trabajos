
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../services/auth.service';
import { ModalService } from '../../../../services/modal.service';
import { AlertComponent } from '../../../ui/alert/alert.component';

type Employee = {
  id: number;
  name: string;
  email: string;
  avatar: string;
  color: string;
  rol: 'Administrador' | 'Usuario';
};

type EmployeeForm = Omit<Employee, 'id' | 'avatar'>;

type AlertItem = {
  id: number;
  variant: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
};

@Component({
  selector: 'app-basic-table-five',
  standalone: true,
  imports: [CommonModule, FormsModule, AlertComponent],
  templateUrl: './basic-table-five.component.html',
  styles: ``
})
export class BasicTableFiveComponent {
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

  form: EmployeeForm = this.getEmptyForm();
  editingId: number | null = null;
  alerts: AlertItem[] = [];
  private alertId = 0;

  readonly isModalOpen$;

  constructor(private auth: AuthService, private modal: ModalService) {
    this.isModalOpen$ = this.modal.isOpen$;
  }

  addOrUpdate() {
    if (!this.form.name || !this.form.email) {
      return;
    }

    if (this.editingId !== null) {
      this.employees = this.employees.map(emp =>
        emp.id === this.editingId ? { ...emp, ...this.form } : emp,
      );
      this.showAlert('success', 'Empleado actualizado', `${this.form.name} ha sido actualizado.`);
    } else {
      const nextId = Math.max(0, ...this.employees.map(e => e.id)) + 1;
      this.employees = [...this.employees, { ...this.form, id: nextId, avatar: this.getAvatar() }];
      this.showAlert('success', 'Empleado agregado', `${this.form.name} se añadió correctamente.`);
    }

    this.resetForm();
    this.modal.closeModal();
  }

  startAdd() {
    this.resetForm();
    this.modal.openModal();
  }

  edit(emp: Employee) {
    this.form = { name: emp.name, email: emp.email, color: emp.color, rol: emp.rol };
    this.editingId = emp.id;
    this.modal.openModal();
  }

  remove(id: number) {
    const removed = this.employees.find(emp => emp.id === id);
    this.employees = this.employees.filter(emp => emp.id !== id);
    if (this.editingId === id) {
      this.resetForm();
    }
    if (removed) {
      this.showAlert('warning', 'Empleado eliminado', `${removed.name} fue eliminado.`);
    }
  }

  cancelEdit() {
    this.resetForm();
    this.modal.closeModal();
  }

  private resetForm() {
    this.form = this.getEmptyForm();
    this.editingId = null;
  }

  private getEmptyForm(): EmployeeForm {
    return {
      name: '',
      email: '',
      color: '#10b981',
      rol: 'Usuario',
    };
  }

  private getAvatar(): string {
    return this.auth.user?.picture || '/images/user/owner.png';
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
