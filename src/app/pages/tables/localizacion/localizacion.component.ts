import { Component } from '@angular/core';
import { ComponentCardComponent } from '../../../shared/components/common/component-card/component-card.component';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { LocationTableComponent } from '../../../shared/components/tables/location-table/location-table.component';
import { AuthService } from '../../../shared/services/auth.service';
import { CommonModule, Location } from '@angular/common';

@Component({
  selector: 'app-localizacion',
  standalone: true,
  imports: [ComponentCardComponent, PageBreadcrumbComponent, LocationTableComponent, CommonModule],
  templateUrl: './localizacion.component.html',
  styles: ``
})
export class LocalizacionComponent {
  constructor(
    private authService: AuthService,
    private location: Location
  ) {}

  isAdmin(): boolean {
    const employee = this.authService.employee;
    return employee?.role === 'Administrador';
  }

  goBack(): void {
    this.location.back();
  }
}
