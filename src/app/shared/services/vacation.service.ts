import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { EmployeeService } from './employee.service';

export interface VacationRequest {
  id: number;
  employee_id: number;
  start_date: string;
  end_date: string;
  type: 'vacation' | 'day-off';
  status: 'pending' | 'approved' | 'rejected';
  reason: string | null;
  decided_by_employee_id: number | null;
  decided_at: string | null;
  request_date?: string;
}

export type VacationRequestInsert = Omit<VacationRequest, 'id' | 'request_date' | 'decided_by_employee_id' | 'decided_at'>;
export type VacationRequestUpdate = Partial<Omit<VacationRequest, 'id' | 'request_date'>>;

@Injectable({ providedIn: 'root' })
export class VacationService {
  constructor(private supabase: SupabaseService, private employeeService: EmployeeService) {}

  async getAll(): Promise<VacationRequest[]> {
    try {
      console.log('[VacationService] getAll() - Consultando vacation_requests...');

      // Verificar usuario autenticado
      const { data: { user } } = await this.supabase.supabase.auth.getUser();
      console.log('[VacationService] Usuario autenticado:', user?.email, 'ID:', user?.id);

      // Obtener el rol del usuario desde la tabla employees
      const { data: employeeData } = await this.supabase.supabase
        .from('employees')
        .select('id, role, email')
        .eq('email', user?.email!)
        .single();

      console.log('[VacationService] Datos del empleado:', employeeData);
      console.log('[VacationService] Es admin?', employeeData?.role === 'Administrador');

      // Intentar obtener el conteo de registros
      const { count, error: countError } = await this.supabase.supabase
        .from('vacation_requests')
        .select('*', { count: 'exact' })
        .limit(1);

      console.log('[VacationService] COUNT query - Error:', countError);
      console.log('[VacationService] COUNT query - Total registros en BD:', count);

      const { data, error } = await this.supabase.supabase
        .from('vacation_requests')
        .select('*')
        .order('request_date', { ascending: false });

      if (error) {
        console.error('[VacationService] Error en getAll():', error);
        throw error;
      }

      console.log('[VacationService] getAll() - Datos recibidos:', data);
      console.log('[VacationService] Cantidad de registros devueltos:', data?.length);
      return data || [];
    } catch (error) {
      console.error('[VacationService] Exception en getAll():', error);
      throw error;
    }
  }

  async getByEmployeeId(employeeId: number): Promise<VacationRequest[]> {
    const { data, error } = await this.supabase.supabase
      .from('vacation_requests')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getByStatus(status: 'pending' | 'approved' | 'rejected'): Promise<VacationRequest[]> {
    const { data, error } = await this.supabase.supabase
      .from('vacation_requests')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async create(request: VacationRequestInsert): Promise<VacationRequest> {
    const { data, error } = await this.supabase.supabase
      .from('vacation_requests')
      .insert(request)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async approve(id: number, decidedByEmployeeId: number, comment?: string, sendEmail: boolean = true): Promise<VacationRequest> {
    const { data, error } = await this.supabase.supabase
      .from('vacation_requests')
      .update({
        status: 'approved',
        decided_by_employee_id: decidedByEmployeeId,
        decided_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (sendEmail) {
      await this.notifyDecisionEmail(data, comment);
    }
    return data;
  }

  async reject(id: number, decidedByEmployeeId: number, comment?: string, sendEmail: boolean = true): Promise<VacationRequest> {
    const { data, error } = await this.supabase.supabase
      .from('vacation_requests')
      .update({
        status: 'rejected',
        decided_by_employee_id: decidedByEmployeeId,
        decided_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (sendEmail) {
      await this.notifyDecisionEmail(data, comment);
    }
    return data;
  }

  async delete(id: number): Promise<void> {
    const { error } = await this.supabase.supabase
      .from('vacation_requests')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  private async notifyDecisionEmail(request: VacationRequest, emailComment?: string): Promise<void> {
    try {
      console.log('[VacationService] Enviando notificación de decisión para request:', request.id);

      const employee = await this.employeeService.getById(request.employee_id);
      if (!employee?.email) {
        console.warn('[VacationService] No hay email del empleado, saltando notificación');
        return;
      }

      const decidedBy = request.decided_by_employee_id
        ? await this.employeeService.getById(request.decided_by_employee_id)
        : null;

      const payload = {
        to: employee.email?.trim() || '',
        status: request.status,
        type: request.type,
        employeeName: employee.name?.trim() || '',
        start_date: request.start_date?.trim() || '',
        end_date: request.end_date?.trim() || undefined,
        comment: (emailComment || request.reason || '')?.trim() || undefined,
        decidedByName: decidedBy?.name?.trim() || undefined,
      } as any;

      console.log('[VacationService] Payload de email:', payload);

      // Obtener la URL base de Supabase y la anon key
      const supabaseUrl = this.supabase.supabaseUrl;
      const functionUrl = `${supabaseUrl}/functions/v1/Mail-send-vacations`;

      // Obtener la anon key desde el cliente de Supabase
      const anonKey = (this.supabase.supabase as any)._getSession?.()?.access_token ||
                      (this.supabase.supabase as any).getSession?.()?.data?.session?.access_token;

      // Si no hay access token, usa la anon key del environment (pública)
      const authToken = anonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtYmh5bGV6cnFvYWN6cXFpcXdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MzUwMDAsImV4cCI6MjA1MTUxMTAwMH0.xVvEJEsWwGDhcYzF6tMDvN5TqJpEHExJXlBrYp_9wz8';

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('[VacationService] Respuesta de función:', { status: response.status, data });
    } catch (e) {
      console.error('[VacationService] Error enviando email de decisión:', e);
    }
  }
}
