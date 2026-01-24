import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SupabaseService } from '../services/supabase.service';

export const authGuard: CanActivateFn = async (): Promise<boolean | UrlTree> => {
  console.log('[AuthGuard] Executing...');
  const auth = inject(AuthService);
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  try {
    // Esperar a que Supabase restaure la sesión con más tiempo
    console.log('[AuthGuard] Waiting for Supabase session restoration...');
    let session = await supabase.getSession();
    console.log('[AuthGuard] First session check:', session ? 'exists' : 'null');

    // Si no hay sesión, esperar más tiempo y reintentar
    if (!session) {
      console.log('[AuthGuard] No session on first check, waiting 1s and retrying...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      session = await supabase.getSession();
      console.log('[AuthGuard] Second session check:', session ? 'exists' : 'null');
    }

    // Esperar a que AuthService se sincronice completamente con la sesión
    console.log('[AuthGuard] Waiting for AuthService to sync...');
    await new Promise(resolve => setTimeout(resolve, 500));

    const isAuth = auth.isAuthenticated();
    console.log('[AuthGuard] isAuthenticated:', isAuth);

    if (!isAuth) {
      console.log('[AuthGuard] User not authenticated, redirecting to /signin');
      return router.createUrlTree(['/signin']);
    }

    // Verificar si está registrado como empleado
    const isEmp = auth.isEmployee();
    console.log('[AuthGuard] isEmployee:', isEmp);

    if (!isEmp) {
      console.log('[AuthGuard] User authenticated but not registered as employee, redirecting to /unauthorized');
      return router.createUrlTree(['/unauthorized']);
    }

    console.log('[AuthGuard] User authenticated and registered as employee, allowing access');
    return true;
  } catch (error) {
    console.error('[AuthGuard] Error checking session:', error);
    return router.createUrlTree(['/signin']);
  }
};
