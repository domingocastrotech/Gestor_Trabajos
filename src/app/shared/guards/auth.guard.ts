import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (): boolean | UrlTree => {
  console.log('[AuthGuard] Executing...');
  const auth = inject(AuthService);
  const router = inject(Router);

  const isAuth = auth.isAuthenticated();
  console.log('[AuthGuard] isAuthenticated:', isAuth);

  if (isAuth) {
    console.log('[AuthGuard] User authenticated, allowing access');
    return true;
  }

  console.log('[AuthGuard] User not authenticated, redirecting to /signin');
  return router.createUrlTree(['/signin']);
};