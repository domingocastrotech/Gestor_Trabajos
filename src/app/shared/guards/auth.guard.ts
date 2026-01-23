import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (): Promise<boolean | UrlTree> => {
  console.log('[AuthGuard] Executing...');
  const auth = inject(AuthService);
  const router = inject(Router);

  // Esperar a que se complete la restauración de usuario
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
};
