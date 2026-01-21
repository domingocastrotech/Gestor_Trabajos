import { Inject, Injectable, PLATFORM_ID, signal, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { SupabaseService } from './supabase.service';
import { environment } from '../../../environments/environment';

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface Employee {
  id: number;
  name: string;
  email: string;
  color: string;
  role: string;
  is_active: boolean;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private userSignal = signal<GoogleUser | null>(null);
  private employeeSignal = signal<Employee | null>(null);
  private readonly storageKey = 'googleUser';

  constructor(
    private router: Router,
    private supabase: SupabaseService,
    private injector: Injector,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {
    console.log('[AuthService] Initializing...');
    this.restoreUser();
    console.log('[AuthService] Initialized. User:', this.userSignal());
  }

  get user(): GoogleUser | null {
    return this.userSignal();
  }

  get employee(): Employee | null {
    return this.employeeSignal();
  }

  isAuthenticated(): boolean {
    const u = this.userSignal();
    const result = !!(u && u.id && u.email);
    console.log('[AuthService] isAuthenticated check:', result, 'User:', u);
    return result;
  }

  async signInWithGoogle(): Promise<void> {
    if (!this.isBrowser()) {
      console.error('[AuthService] No está en el navegador');
      return;
    }

    try {
      console.log('[AuthService] Iniciando autenticación con Google vía Supabase...');
      const redirectUrl = environment.production
        ? `${environment.appUrl}/auth/callback`
        : `${window.location.origin}/auth/callback`;

      console.log('[AuthService] Redirect URL configurada:', redirectUrl);

      const { data, error } = await this.supabase.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) {
        console.error('[AuthService] Error al iniciar sesión con Google:', error);
        throw error;
      }

      console.log('[AuthService] Redirección a Google iniciada');
    } catch (err) {
      console.error('[AuthService] Error en signInWithGoogle:', err);
      throw err;
    }
  }
  async handleAuthCallback(): Promise<GoogleUser | null> {
    if (!this.isBrowser()) {
      return null;
    }

    try {
      console.log('[AuthService] Procesando callback de autenticación...');

      // Esperar a que Supabase procese la URL con el token
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Obtener la sesión (ahora detectSessionInUrl está en true)
      const { data: { session }, error } = await this.supabase.supabase.auth.getSession();

      if (error || !session?.user) {
        console.error('[AuthService] Error obteniendo sesión:', error?.message || 'Session missing');
        return null;
      }

      const supabaseUser = session.user;
      console.log('[AuthService] Usuario de Supabase:', supabaseUser.email);

      // Crear GoogleUser
      const googleUser: GoogleUser = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: supabaseUser.user_metadata?.['full_name'] || supabaseUser.user_metadata?.['name'] || '',
        picture: supabaseUser.user_metadata?.['avatar_url'] || supabaseUser.user_metadata?.['picture'],
      };

      this.userSignal.set(googleUser);

      if (this.isBrowser()) {
        localStorage.setItem(this.storageKey, JSON.stringify(googleUser));
      }

      console.log('[AuthService] Usuario guardado:', googleUser.email);

      // Buscar el empleado asociado por email
      await this.loadEmployeeByEmail(googleUser.email);

      // Cargar notificaciones
      try {
        const notificationService = this.injector.get(await import('./notification.service').then(m => m.NotificationService));
        await notificationService.init();
      } catch (err) {
        console.error('[AuthService] Error loading notifications:', err);
      }

      return googleUser;
    } catch (err) {
      console.error('[AuthService] Error en handleAuthCallback:', err);
      return null;
    }
  }

  private async loadEmployeeByEmail(email: string): Promise<void> {
    try {
      console.log('[AuthService] Buscando empleado con email:', email);

      // Buscar el empleado directamente
      const { data: employeeData, error: findError } = await this.supabase.supabase
        .from('employees')
        .select('*')
        .eq('email', email)
        .single();

      if (findError) {
        console.error('[AuthService] ERROR - No se pudo obtener el empleado:', findError.message);
        console.error('[AuthService] ⚠️ Asegúrate de que la tabla "employees" tiene una política RLS que permite SELECT a usuarios autenticados');
        console.error('[AuthService] Código:', findError.code);
        this.employeeSignal.set(null);
        return;
      }

      console.log('[AuthService] ✓ Employee encontrado:', employeeData?.email);
      await this.activateEmployee(employeeData);
    } catch (err) {
      console.error('[AuthService] Error cargando empleado:', err);
      this.employeeSignal.set(null);
    }
  }

  private async activateEmployee(employeeData: any): Promise<void> {
    if (!employeeData?.id) {
      this.employeeSignal.set(employeeData);
      return;
    }

    console.log('[AuthService] Activando empleado (is_active = true)...');

    // Intentar usando RPC function
    const { error: rpcError } = await this.supabase.supabase
      .rpc('set_employee_active', { employee_id: employeeData.id });

    if (rpcError) {
      console.warn('[AuthService] RPC no disponible, intentando UPDATE:', rpcError.message);

      // Fallback: UPDATE directo
      const { error: updateError } = await this.supabase.supabase
        .from('employees')
        .update({ is_active: true })
        .eq('id', employeeData.id);

      if (updateError) {
        console.warn('[AuthService] No se pudo actualizar is_active:', updateError.message);
      } else {
        console.log('[AuthService] ✓ is_active actualizado a true');
      }
    } else {
      console.log('[AuthService] ✓ is_active actualizado a true (via RPC)');
    }

    this.employeeSignal.set({ ...employeeData, is_active: true });
  }

  async signOut(): Promise<void> {
    console.log('[AuthService] ========== INICIANDO LOGOUT ==========');

    // Verificar sesión de Supabase
    const session = await this.supabase.getSession();
    console.log('[AuthService] Sesión actual de Supabase:', session);
    console.log('[AuthService] Email en sesión:', session?.user?.email);

    // Actualizar is_active a false antes de cerrar sesión
    const currentEmployee = this.employeeSignal();
    console.log('[AuthService] Employee actual:', currentEmployee);
    console.log('[AuthService] Employee ID:', currentEmployee?.id);

    if (currentEmployee?.id) {
      try {
        console.log('[AuthService] Actualizando is_active a false para employee ID:', currentEmployee.id);

        // Intentar usando RPC function (más seguro con RLS)
        console.log('[AuthService] Intentando con RPC function set_employee_inactive...');
        const { error: rpcError } = await this.supabase.supabase
          .rpc('set_employee_inactive', { employee_id: currentEmployee.id });

        if (rpcError) {
          console.warn('[AuthService] RPC no disponible, intentando UPDATE directo:', rpcError);

          // Fallback: intentar update directo
          const { error } = await this.supabase.supabase
            .from('employees')
            .update({ is_active: false })
            .eq('id', currentEmployee.id);

          if (error) {
            console.warn('[AuthService] No se pudo actualizar is_active en logout:', error.message);
          } else {
            console.log('[AuthService] ✓ Employee is_active actualizado a false');
          }
        } else {
          console.log('[AuthService] ✓ Employee is_active actualizado via RPC');
        }
      } catch (err) {
        console.error('[AuthService] EXCEPCIÓN al actualizar employee is_active:', err);
      }
    } else {
      console.warn('[AuthService] ⚠ No hay employee actual o no tiene ID, saltando actualización de is_active');
    }

    console.log('[AuthService] Limpiando signals...');
    this.userSignal.set(null);
    this.employeeSignal.set(null);

    if (this.isBrowser()) {
      console.log('[AuthService] Limpiando localStorage y sessionStorage...');
      localStorage.removeItem(this.storageKey);
      sessionStorage.removeItem(this.storageKey);
    }

    // Sign out de Supabase
    try {
      console.log('[AuthService] Cerrando sesión de Supabase...');
      await this.supabase.signOut();
      console.log('[AuthService] ✓ Sesión de Supabase cerrada');
    } catch (err) {
      console.error('[AuthService] Error signing out from Supabase:', err);
    }

    console.log('[AuthService] Redirigiendo a /signin...');
    console.log('[AuthService] ========== LOGOUT COMPLETADO ==========');
    this.router.navigate(['/signin']);
  }

  private async restoreUser(): Promise<void> {
    console.log('[AuthService] restoreUser: Starting...');
    if (!this.isBrowser()) {
      console.log('[AuthService] restoreUser: Not in browser, skipping');
      return;
    }

    try {
      // Intentar restaurar la sesión de Supabase primero (con timeout para evitar locks)
      const timeoutPromise = new Promise<null>((resolve) =>
        setTimeout(() => resolve(null), 2000)
      );

      const sessionPromise = this.supabase.supabase.auth.getSession();
      const result = await Promise.race([sessionPromise, timeoutPromise]);

      if (result && 'data' in result) {
        const { data: { session }, error } = result as any;
        if (!error && session?.user) {
          console.log('[AuthService] Sesión de Supabase encontrada');
          const supabaseUser = session.user;

          const user: GoogleUser = {
            id: supabaseUser.id,
            email: supabaseUser.email || '',
            name: supabaseUser.user_metadata?.['full_name'] || supabaseUser.user_metadata?.['name'] || '',
            picture: supabaseUser.user_metadata?.['avatar_url'] || supabaseUser.user_metadata?.['picture'],
          };

          this.userSignal.set(user);
          localStorage.setItem(this.storageKey, JSON.stringify(user));

          // Cargar el empleado asociado
          await this.loadEmployeeByEmail(user.email);

          console.log('[AuthService] restoreUser: User restored from Supabase:', user.email);
          return;
        }
      }
    } catch (err) {
      console.error('[AuthService] Error al restaurar sesión de Supabase:', err);
    }

    // Si no hay sesión de Supabase, intentar desde localStorage (fallback)
    const raw = localStorage.getItem(this.storageKey);
    console.log('[AuthService] restoreUser: localStorage data:', raw ? 'found' : 'not found');
    if (!raw) {
      return;
    }

    try {
      const stored = JSON.parse(raw) as GoogleUser;
      this.userSignal.set(stored);

      // Cargar el empleado también desde localStorage restaurado
      await this.loadEmployeeByEmail(stored.email);

      console.log('[AuthService] restoreUser: User restored from localStorage:', stored.email);
    } catch (err) {
      console.error('[AuthService] restoreUser: Failed to parse user data', err);
      localStorage.removeItem(this.storageKey);
    }
  }

  private ensureUTF8(str: string): string {
    if (!str) return str;
    try {
      // Asegurar que el string está correctamente interpretado como UTF-8
      return decodeURIComponent(encodeURIComponent(str));
    } catch {
      return str;
    }
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
