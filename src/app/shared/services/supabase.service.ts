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

    // Suprimir el error NavigatorLockAcquireTimeoutError que es un warning de Supabase
    this.suppressNavigatorLockError();

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

  /**
   * Suprimir el error NavigatorLockAcquireTimeoutError que Supabase lanza
   * cuando hay problemas con la sincronización de tokens entre pestañas.
   * Este es un warning inofensivo que no afecta la funcionalidad.
   */
  private suppressNavigatorLockError(): void {
    if (!this.isBrowser()) return;

    const originalError = console.error;
    console.error = (...args: any[]) => {
      // Filtrar el error específico de NavigatorLockAcquireTimeoutError
      const errorMsg = args[0]?.toString?.() || '';
      if (errorMsg.includes('NavigatorLockAcquireTimeoutError')) {
        // Ignorar este error específico silenciosamente
        return;
      }
      // Para otros errores, mostrarlos normalmente
      originalError.apply(console, args);
    };
  }
}
