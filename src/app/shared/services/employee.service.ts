import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Employee {
  id: number;
  name: string;
  email: string;
  color: string;
  role: string;
  is_active: boolean;
  avatar?: string;
  created_at?: string;
}

export type EmployeeInsert = Omit<Employee, 'id' | 'created_at'>;
export type EmployeeUpdate = Partial<EmployeeInsert>;

@Injectable({ providedIn: 'root' })
export class EmployeeService {
  constructor(private supabase: SupabaseService) {}

  async getAll(): Promise<Employee[]> {
    // Verificar que hay sesión antes de consultar
    const session = await this.supabase.getSession();
    if (!session) {
      console.warn('[EmployeeService] No hay sesión de Supabase activa');
      return [];
    }

    console.log('[EmployeeService] Consultando empleados con email:', session.user?.email);

    const { data, error } = await this.supabase.supabase
      .from('employees')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('[EmployeeService] Error al obtener empleados:', error);
      console.error('[EmployeeService] Detalles del error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    console.log('[EmployeeService] Empleados obtenidos:', data?.length || 0);
    return data || [];
  }

  async getAllEmployees(): Promise<Employee[]> {
    // Obtener TODOS los empleados sin filtrar por is_active
    // Solo para administradores
    const session = await this.supabase.getSession();
    if (!session) {
      console.warn('[EmployeeService] No hay sesión de Supabase activa');
      return [];
    }

    console.log('[EmployeeService] Consultando TODOS los empleados...');

    const { data, error } = await this.supabase.supabase
      .from('employees')
      .select('*')
      .order('name');

    if (error) {
      console.error('[EmployeeService] Error al obtener todos los empleados:', error);
      throw error;
    }

    console.log('[EmployeeService] Todos los empleados obtenidos:', data?.length || 0);
    return data || [];
  }

  async getById(id: number): Promise<Employee | null> {
    const { data, error } = await this.supabase.supabase
      .from('employees')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async getByEmail(email: string): Promise<Employee | null> {
    const { data, error } = await this.supabase.supabase
      .from('employees')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows returned
      throw error;
    }
    return data;
  }

  async create(employee: EmployeeInsert): Promise<Employee> {
    // Verificar sesión
    const session = await this.supabase.getSession();
    if (!session) {
      throw new Error('No hay sesión activa. Por favor, inicia sesión primero.');
    }

    const { data, error } = await this.supabase.supabase
      .from('employees')
      .insert(employee)
      .select()
      .single();

    if (error) {
      console.error('[EmployeeService] Error al crear empleado:', error);
      throw error;
    }
    return data;
  }

  async update(id: number, employee: EmployeeUpdate): Promise<Employee> {
    const { data, error } = await this.supabase.supabase
      .from('employees')
      .update(employee)
      .eq('id', id)
      .select();

    if (error) {
      console.error('[EmployeeService] Error al actualizar empleado:', error);
      throw error;
    }

    // Retornar el primer elemento del array
    return data?.[0] || {};
  }

  async delete(id: number): Promise<void> {
    // Eliminar empleado con sus tareas y notificaciones asociadas
    console.log('[EmployeeService] Eliminando empleado ID:', id);
    console.log('[EmployeeService] Las tareas y notificaciones asociadas se eliminarán automáticamente (CASCADE)');

    const { error } = await this.supabase.supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[EmployeeService] Error eliminando empleado:', error.message);
      throw error;
    }

    console.log('[EmployeeService] ✓ Empleado eliminado correctamente');
    console.log('[EmployeeService] ✓ Tareas y notificaciones asociadas eliminadas automáticamente');
  }

  async updateIsActive(id: number, isActive: boolean): Promise<void> {
    const { error } = await this.supabase.supabase
      .from('employees')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) throw error;
  }
}
