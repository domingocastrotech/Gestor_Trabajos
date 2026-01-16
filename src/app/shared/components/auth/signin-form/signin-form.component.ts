
import { AfterViewInit, ChangeDetectorRef, Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-signin-form',
  imports: [
    RouterModule,
],
  templateUrl: './signin-form.component.html',
  styles: ``
})
export class SigninFormComponent implements AfterViewInit {
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit(): void {
    this.waitForGoogleScript();
  }

  private waitForGoogleScript(): void {
    const checkGoogle = () => {
      if (typeof (window as any).google !== 'undefined') {
        const initialized = this.authService.initializeGoogleSignIn(
          this.handleCredentialResponse.bind(this),
        );

        if (!initialized) {
          this.errorMessage = 'No se pudo cargar Google Sign-In. Comprueba tu conexión e inténtalo de nuevo.';
          this.cdr.detectChanges();
        }
      } else {
        // Reintentar después de 100ms
        setTimeout(checkGoogle, 100);
      }
    };

    setTimeout(checkGoogle, 0);
  }

  private handleCredentialResponse(response: any): void {
    const user = this.authService.handleCredentialResponse(response);
    if (user) {
      this.router.navigateByUrl('/');
      return;
    }

    this.errorMessage = 'No se pudo iniciar sesión con Google. Inténtalo de nuevo.';
  }
}
