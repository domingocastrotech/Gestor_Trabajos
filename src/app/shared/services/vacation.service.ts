import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface VacationRequest {
  id: number;
  employee_id: number;
  start_date: string;
  end_date: string;
  vacation_type: 'vacation' | 'day-off';
  status: 'pending' | 'approved' | 'rejected';
  reason: string | null;
  reviewed_by_employee_id: number | null;
  reviewed_at: string | null;
  created_at?: string;
}

export type VacationRequestInsert = Omit<VacationRequest, 'id' | 'created_at' | 'reviewed_by_employee_id' | 'reviewed_at'>;
export type VacationRequestUpdate = Partial<Omit<VacationRequest, 'id' | 'created_at'>>;

@Injectable({ providedIn: 'root' })
export class VacationService {
  constructor(private supabase: SupabaseService) {}

  async getAll(): Promise<VacationRequest[]> {
    const { data, error } = await this.supabase.supabase
      .from('vacation_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
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

  async approve(id: number, reviewedByEmployeeId: number): Promise<VacationRequest> {
    const { data, error } = await this.supabase.supabase
      .from('vacation_requests')
      .update({
        status: 'approved',
        reviewed_by_employee_id: reviewedByEmployeeId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async reject(id: number, reviewedByEmployeeId: number): Promise<VacationRequest> {
    const { data, error } = await this.supabase.supabase
      .from('vacation_requests')
      .update({
        status: 'rejected',
        reviewed_by_employee_id: reviewedByEmployeeId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: number): Promise<void> {
    const { error } = await this.supabase.supabase
      .from('vacation_requests')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
