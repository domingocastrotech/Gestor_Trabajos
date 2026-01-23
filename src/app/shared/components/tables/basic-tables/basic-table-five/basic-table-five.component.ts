
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../services/auth.service';
import { ModalService } from '../../../../services/modal.service';
import { AlertComponent } from '../../../ui/alert/alert.component';
import { EmployeeService, Employee, EmployeeInsert } from '../../../../services/employee.service';
import { TaskService } from '../../../../services/task.service';

type EmployeeForm = EmployeeInsert;

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
export class BasicTableFiveComponent implements OnInit {
  employees: Employee[] = [];
  isLoading = true;

  form: EmployeeForm = this.getEmptyForm();
  editingId: number | null = null;
  alerts: AlertItem[] = [];
  private alertId = 0;

  // Modal de confirmación de borrado
  deleteConfirmation: {
    isOpen: boolean;
    employeeId: number | null;
    employeeName: string;
    taskCount: number;
  } = {
    isOpen: false,
    employeeId: null,
    employeeName: '',
    taskCount: 0
  };

  readonly isModalOpen$;

  constructor(
    private auth: AuthService,
    private modal: ModalService,
    private employeeService: EmployeeService,
    private taskService: TaskService
  ) {
    this.isModalOpen$ = this.modal.isOpen$;
  }

  async ngOnInit() {
    // Esperar a que se complete la restauración del usuario
    await new Promise(resolve => setTimeout(resolve, 1000));
    await this.loadEmployees();
  }

  private async loadEmployees() {
    try {
      this.isLoading = true;
      console.log('[BasicTableFive] Cargando empleados...');
      console.log('[BasicTableFive] Usuario actual:', this.auth.employee?.email);

      // Verificar si el usuario es administrador
      const currentEmployee = this.auth.employee;
      const isAdmin = currentEmployee?.role === 'Administrador';

      if (isAdmin) {
        console.log('[BasicTableFive] Usuario es Administrador - Cargando TODOS los empleados');
        this.employees = await this.employeeService.getAllEmployees();
      } else {
        console.log('[BasicTableFive] Usuario NO es Administrador - Cargando solo empleados activos');
        this.employees = await this.employeeService.getAll();
      }

      console.log('[BasicTableFive] Empleados cargados:', this.employees.length);

      if (this.employees.length === 0) {
        console.warn('[BasicTableFive] No se encontraron empleados. Verifica las políticas RLS en Supabase.');
      }
    } catch (error) {
      console.error('[BasicTableFive] Error loading employees:', error);
      this.showAlert('error', 'Error', 'No se pudieron cargar los empleados. Verifica que tengas permisos en Supabase.');
    } finally {
      this.isLoading = false;
    }
  }

  async addOrUpdate() {
    if (!this.form.name || !this.form.email) {
      return;
    }

    try {
      if (this.editingId !== null) {
        await this.employeeService.update(this.editingId, this.form);
        this.showAlert('success', 'Empleado actualizado', `${this.form.name} ha sido actualizado.`);
      } else {
        console.log('[BasicTableFive] Creando empleado:', this.form);
        await this.employeeService.create(this.form);
        this.showAlert('success', 'Empleado agregado', `${this.form.name} se añadió correctamente.`);
      }

      await this.loadEmployees();
      this.resetForm();
      this.modal.closeModal();
    } catch (error: any) {
      console.error('[BasicTableFive] Error saving employee:', error);
      const message = error?.message || 'No se pudo guardar el empleado. Verifica las políticas RLS en Supabase.';
      this.showAlert('error', 'Error', message);
    }
  }

  startAdd() {
    this.resetForm();
    this.modal.openModal();
  }

  edit(emp: Employee) {
    this.form = {
      name: emp.name,
      email: emp.email,
      color: emp.color,
      role: emp.role,
      is_active: emp.is_active
    };
    this.editingId = emp.id;
    this.modal.openModal();
  }

  /**
   * Verifica si el empleado siendo editado es el usuario actual
   */
  isEditingCurrentUser(): boolean {
    if (this.editingId === null) return false;
    const currentUser = this.auth.employee;
    const editingEmployee = this.employees.find(emp => emp.id === this.editingId);
    return currentUser?.email === editingEmployee?.email;
  }

  /**
   * Verifica si se puede eliminar un empleado (no puede ser el usuario actual)
   */
  canDelete(id: number): boolean {
    const currentUser = this.auth.employee;
    const employeeToDelete = this.employees.find(emp => emp.id === id);
    return currentUser?.email !== employeeToDelete?.email;
  }

  /**
   * Abre el modal de confirmación para eliminar
   */
  async openDeleteConfirmation(id: number) {
    // No permitir eliminar el usuario actual
    if (!this.canDelete(id)) {
      this.showAlert('error', 'Error', 'No puedes eliminar tu propio usuario');
      return;
    }

    const employee = this.employees.find(emp => emp.id === id);

    if (employee) {
      // Verificar si tiene tareas asignadas
      try {
        const tasks = await this.taskService.getByEmployeeId(id);
        const taskCount = tasks.length;

        this.deleteConfirmation = {
          isOpen: true,
          employeeId: id,
          employeeName: employee.name,
          taskCount: taskCount
        };
      } catch (error) {
        console.error('[BasicTableFive] Error verificando tareas:', error);
        // Continuar con la eliminación sin contar tareas
        this.deleteConfirmation = {
          isOpen: true,
          employeeId: id,
          employeeName: employee.name,
          taskCount: 0
        };
      }
    }
  }

  /**
   * Cierra el modal de confirmación
   */
  closeDeleteConfirmation() {
    this.deleteConfirmation = {
      isOpen: false,
      employeeId: null,
      employeeName: '',
      taskCount: 0
    };
  }

  /**
   * Confirma y ejecuta la eliminación
   */
  async confirmDelete() {
    if (this.deleteConfirmation.employeeId === null) return;

    const id = this.deleteConfirmation.employeeId;
    const name = this.deleteConfirmation.employeeName;

    try {
      await this.employeeService.delete(id);
      await this.loadEmployees();

      if (this.editingId === id) {
        this.resetForm();
      }

      this.showAlert('warning', 'Empleado eliminado', `${name} fue eliminado junto con todas sus tareas y notificaciones.`);
    } catch (error) {
      console.error('Error deleting employee:', error);
      this.showAlert('error', 'Error', 'No se pudo eliminar el empleado');
    } finally {
      this.closeDeleteConfirmation();
    }
  }

  async remove(id: number) {
    this.openDeleteConfirmation(id);
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
      role: 'Usuario',
      is_active: true
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
