
import { AfterViewInit, Component } from '@angular/core';
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
  ) {}

  ngAfterViewInit(): void {
    const initialized = this.authService.initializeGoogleSignIn(
      this.handleCredentialResponse.bind(this),
    );

    if (!initialized) {
      this.errorMessage = 'No se pudo cargar Google Sign-In. Comprueba tu conexión e inténtalo de nuevo.';
    }
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
