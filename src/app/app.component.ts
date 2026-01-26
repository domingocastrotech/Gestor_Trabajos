import { Component, inject, signal, OnInit, HostBinding } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError, Event, RouterModule } from '@angular/router';
import { AuthService } from './shared/services/auth.service';
import { ThemeService } from './shared/services/theme.service';
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
export class AppComponent implements OnInit {
  title = 'Gestor de Trabajo';
  authService = inject(AuthService);
  router = inject(Router);
  themeService = inject(ThemeService);

  @HostBinding('class.dark') isDark = false;

  ngOnInit() {
    this.themeService.theme$.subscribe(theme => {
      this.isDark = theme === 'dark';
    });
  }

  get isLoadingProfile(): boolean {
    // Solo mostrar la pantalla de carga en la carga inicial
    // Una vez que se cargó, no mostrar más incluso si se recarga
    return this.authService.isLoading;
  }
}


