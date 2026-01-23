import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private client: SupabaseClient;

  constructor(@Inject(PLATFORM_ID) private platformId: object) {
    if (!environment.supabaseUrl || !environment.supabaseKey) {
      throw new Error('Supabase configuration is missing (url/key).');
    }

    // Single client for the whole app; persists session in browser only.
    this.client = createClient(environment.supabaseUrl, environment.supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: this.isBrowser(),
        detectSessionInUrl: true,  // IMPORTANTE: debe ser true para detectar el token en la URL
        storage: this.isBrowser() ? localStorage : undefined,
        flowType: 'pkce',  // Cambiado a PKCE para mayor seguridad
      },
    });
  }

  get supabase(): SupabaseClient {
    return this.client;
  }

  get supabaseUrl(): string {
    return environment.supabaseUrl;
  }

  async signOut() {
    return this.client.auth.signOut();
  }

  async getSession(): Promise<Session | null> {
    try {
      const { data, error } = await this.client.auth.getSession();
      if (error) {
        console.error('[SupabaseService] Error getting session:', error);
        return null;
      }
      return data.session;
    } catch (err) {
      console.error('[SupabaseService] Exception getting session:', err);
      return null;
    }
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
