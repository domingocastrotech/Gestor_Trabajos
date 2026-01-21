import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Task {
  id: string;
  title: string;
  start_date: string;
  end_date: string | null;
  start_time: string | null;
  end_time: string | null;
  calendar: string;
  level: string | null;
  location_id: number | null;
  employee_id: number | null;
  description: string | null;
  created_by_employee_id: number | null;
  is_vacation: boolean;
  vacation_type: 'vacation' | 'day-off' | null;
  created_at?: string;
}

export type TaskInsert = Omit<Task, 'id' | 'created_at'>;
export type TaskUpdate = Partial<TaskInsert>;

@Injectable({ providedIn: 'root' })
export class TaskService {
  constructor(private supabase: SupabaseService) {}

  async getAll(): Promise<Task[]> {
    const { data, error } = await this.supabase.supabase
      .from('tasks')
      .select('*')
      .order('start_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getByDateRange(startDate: string, endDate: string): Promise<Task[]> {
    const { data, error } = await this.supabase.supabase
      .from('tasks')
      .select('*')
      .gte('start_date', startDate)
      .lte('start_date', endDate)
      .order('start_date');

    if (error) throw error;
    return data || [];
  }

  async getByEmployeeId(employeeId: number): Promise<Task[]> {
    const { data, error } = await this.supabase.supabase
      .from('tasks')
      .select('*')
      .eq('employee_id', employeeId)
      .order('start_date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async create(task: TaskInsert): Promise<Task> {
    const { data, error } = await this.supabase.supabase
      .from('tasks')
      .insert(task)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, task: TaskUpdate): Promise<Task> {
    const { data, error } = await this.supabase.supabase
      .from('tasks')
      .update(task)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
