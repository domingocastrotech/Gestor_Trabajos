import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';

export interface Location {
  id: number;
  name: string;
  address: string;
  city: string;
  created_at?: string;
}

export type LocationInsert = Omit<Location, 'id' | 'created_at'>;
export type LocationUpdate = Partial<LocationInsert>;

@Injectable({ providedIn: 'root' })
export class LocationService {
  constructor(private supabase: SupabaseService) {}

  async getAll(): Promise<Location[]> {
    const { data, error } = await this.supabase.supabase
      .from('locations')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  }

  async getById(id: number): Promise<Location | null> {
    const { data, error } = await this.supabase.supabase
      .from('locations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(location: LocationInsert): Promise<Location> {
    const { data, error } = await this.supabase.supabase
      .from('locations')
      .insert(location)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: number, location: LocationUpdate): Promise<Location> {
    const { data, error } = await this.supabase.supabase
      .from('locations')
      .update(location)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async delete(id: number): Promise<void> {
    const { error } = await this.supabase.supabase
      .from('locations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
