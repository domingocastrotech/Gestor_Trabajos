import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden">
      <!-- Decoración de fondo -->
      <div class="absolute inset-0 -z-10">
        <div class="absolute top-0 -left-4 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div class="absolute top-0 -right-4 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div class="absolute -bottom-8 left-20 w-72 h-72 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <div class="relative z-10 text-center px-4">
        <!-- Logo o icono -->
        <div class="mb-8 flex justify-center">
          <div class="relative">
            <!-- Spinner mejorado -->
            <div class="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 animate-pulse"></div>
            <div class="relative flex items-center justify-center w-24 h-24 rounded-full bg-white dark:bg-gray-800 shadow-xl">
              <svg class="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </div>
        </div>

        <!-- Título -->
        <h1 class="text-3xl font-bold text-white mb-3">
          Procesando autenticación
        </h1>

        <!-- Descripción -->
        <p class="text-gray-300 mb-8 max-w-md mx-auto leading-relaxed">
          Estamos verificando tu identidad y sincronizando tu información. Por favor espera un momento...
        </p>

        <!-- Barra de progreso animada -->
        <div class="w-64 h-1 bg-gray-700 rounded-full overflow-hidden mx-auto">
          <div class="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-pulse" style="width: 66%"></div>
        </div>

        <!-- Texto secundario -->
        <p class="mt-8 text-sm text-gray-400 animate-pulse">
          No cierres esta ventana
        </p>
      </div>
    </div>

    <style>
      @keyframes blob {
        0%, 100% {
          transform: translate(0, 0) scale(1);
        }
        33% {
          transform: translate(30px, -50px) scale(1.1);
        }
        66% {
          transform: translate(-20px, 20px) scale(0.9);
        }
      }

      .animate-blob {
        animation: blob 7s infinite;
      }

      .animation-delay-2000 {
        animation-delay: 2s;
      }

      .animation-delay-4000 {
        animation-delay: 4s;
      }
    </style>
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
