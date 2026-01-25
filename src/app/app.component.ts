import { Component, inject, signal } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError, Event, RouterModule } from '@angular/router';
import { AuthService } from './shared/services/auth.service';
import { AuthCallbackComponent } from './pages/auth-pages/auth-callback/auth-callback.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterModule,
    AuthCallbackComponent,
    CommonModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'Gestor de Trabajo';
  authService = inject(AuthService);
  router = inject(Router);

  get isLoadingProfile(): boolean {
    // Solo mostrar la pantalla de carga en la carga inicial
    // Una vez que se cargó, no mostrar más incluso si se recarga
    return this.authService.isLoading;
  }
}

