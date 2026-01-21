
import { Component } from '@angular/core';
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
export class SigninFormComponent {
  errorMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async signInWithGoogle(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = '';
      await this.authService.signInWithGoogle();
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      this.errorMessage = 'No se pudo iniciar sesión con Google. Inténtalo de nuevo.';
      this.isLoading = false;
    }
  }
}
