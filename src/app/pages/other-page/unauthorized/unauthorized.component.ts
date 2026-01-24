import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './unauthorized.component.html',
  styles: ``
})
export class UnauthorizedComponent implements OnInit, OnDestroy {
  currentYear: number = new Date().getFullYear();
  private checkAuthInterval: any;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {
    // Guardar la URL anterior antes de llegar a unauthorized
    this.saveReturnUrl();
  }

  ngOnInit() {
    // Verificar inmediatamente si el usuario ahora está autorizado
    this.checkAuthorizationStatus();

    // Verificar periódicamente cada 2 segundos si el estado de autorización cambió
    this.checkAuthInterval = setInterval(() => {
      this.checkAuthorizationStatus();
    }, 2000);
  }

  ngOnDestroy() {
    // Limpiar el intervalo cuando el componente se destruya
    if (this.checkAuthInterval) {
      clearInterval(this.checkAuthInterval);
    }
  }

  private saveReturnUrl() {
    // Obtener la URL del referer o de la navegación anterior
    // Si no hay referer, usar la URL anterior del navegador
    try {
      const referrer = document.referrer;
      if (referrer && referrer.includes(window.location.hostname)) {
        // Extraer la ruta del referer
        const referrerUrl = new URL(referrer);
        const pathFromReferer = referrerUrl.pathname.replace(/^\//, '');

        if (pathFromReferer && pathFromReferer !== 'unauthorized') {
          localStorage.setItem('previousUrl', '/' + pathFromReferer);
          console.log('[UnauthorizedComponent] Saved previous URL:', pathFromReferer);
        }
      }
    } catch (error) {
      console.warn('[UnauthorizedComponent] Could not save return URL:', error);
    }
  }

  private checkAuthorizationStatus() {
    // Si el usuario está autenticado Y es empleado, redirigir a la página anterior
    if (this.authService.isAuthenticated() && this.authService.isEmployee()) {
      console.log('[UnauthorizedComponent] User is now authorized, redirecting...');

      // Limpiar el intervalo antes de navegar
      if (this.checkAuthInterval) {
        clearInterval(this.checkAuthInterval);
      }

      // Obtener la URL anterior del localStorage
      const previousUrl = localStorage.getItem('previousUrl');

      if (previousUrl) {
        // Limpiar el localStorage
        localStorage.removeItem('previousUrl');
        console.log('[UnauthorizedComponent] Redirecting to previous URL:', previousUrl);
        this.router.navigateByUrl(previousUrl);
      } else {
        // Si no hay URL anterior, ir al dashboard
        console.log('[UnauthorizedComponent] No previous URL found, redirecting to /');
        this.router.navigate(['/']);
      }
    }
  }

  async signOut() {
    // Limpiar el intervalo antes de desconectar
    if (this.checkAuthInterval) {
      clearInterval(this.checkAuthInterval);
    }

    // Limpiar la URL guardada
    localStorage.removeItem('previousUrl');

    await this.authService.signOut();
    this.router.navigate(['/signin']);
  }
}
