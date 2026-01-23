import { Component } from '@angular/core';
import { ComponentCardComponent } from '../../../shared/components/common/component-card/component-card.component';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { BasicTableFiveComponent } from '../../../shared/components/tables/basic-tables/basic-table-five/basic-table-five.component';
import { AuthService } from '../../../shared/services/auth.service';
import { CommonModule, Location } from '@angular/common';

@Component({
  selector: 'app-basic-tables',
  imports: [
    ComponentCardComponent,
    PageBreadcrumbComponent,
    BasicTableFiveComponent,
    CommonModule,
  ],
  templateUrl: './basic-tables.component.html',
  styles: ``
})
export class BasicTablesComponent {
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
