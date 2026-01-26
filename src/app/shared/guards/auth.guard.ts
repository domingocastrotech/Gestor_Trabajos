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
    // Esperar a que el AuthService termine de cargar el perfil
    console.log('[AuthGuard] Waiting for AuthService profile loading...');
    let attempts = 0;
    while (auth.isLoading && attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    console.log('[AuthGuard] Profile loading complete after', attempts * 100, 'ms');

    // Obtener la sesión de Supabase
    const session = await supabase.getSession();
    console.log('[AuthGuard] Session check:', session ? 'exists' : 'null');

    // Si la sesión o el usuario están indefinidos, forzar inicio de sesión
    if (!session?.user) {
      console.log('[AuthGuard] Session user is undefined, redirecting to /signin');
      return router.createUrlTree(['/signin']);
    }

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
