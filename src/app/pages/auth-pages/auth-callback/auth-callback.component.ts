import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';

@Component({
  selector: 'app-auth-callback',
  template: `
    <div class="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400"></div>
        <p class="mt-4 text-gray-600 dark:text-gray-400">Procesando autenticación...</p>
      </div>
    </div>
  `,
  styles: ``
})
export class AuthCallbackComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async ngOnInit() {
    try {
      console.log('[AuthCallback] Procesando callback de autenticación...');

      const user = await this.authService.handleAuthCallback();

      if (user) {
        console.log('[AuthCallback] Usuario autenticado correctamente');

        // Esperar un momento para que se cargue el empleado
        await new Promise(resolve => setTimeout(resolve, 500));

        // Verificar si el usuario está registrado como empleado
        const isEmployee = this.authService.isEmployee();

        if (isEmployee) {
          console.log('[AuthCallback] Usuario registrado como empleado, redirigiendo a dashboard');
          this.router.navigate(['/']);
        } else {
          console.warn('[AuthCallback] Usuario no registrado como empleado, redirigiendo a unauthorized');
          this.router.navigate(['/unauthorized']);
        }
      } else {
        console.error('[AuthCallback] No se pudo autenticar el usuario');
        this.router.navigate(['/signin'], {
          queryParams: { error: 'authentication_failed' }
        });
      }
    } catch (error) {
      console.error('[AuthCallback] Error procesando callback:', error);
      this.router.navigate(['/signin'], {
        queryParams: { error: 'callback_error' }
      });
    }
  }
}
