import { Component } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../shared/services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './unauthorized.component.html',
  styles: ``
})
export class UnauthorizedComponent {
  currentYear: number = new Date().getFullYear();

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  async signOut() {
    await this.authService.signOut();
    this.router.navigate(['/signin']);
  }
}
