import { Component } from '@angular/core';
import { ComponentCardComponent } from '../../../shared/components/common/component-card/component-card.component';
import { PageBreadcrumbComponent } from '../../../shared/components/common/page-breadcrumb/page-breadcrumb.component';
import { LocationTableComponent } from '../../../shared/components/tables/location-table/location-table.component';

@Component({
  selector: 'app-localizacion',
  standalone: true,
  imports: [ComponentCardComponent, PageBreadcrumbComponent, LocationTableComponent],
  templateUrl: './localizacion.component.html',
  styles: ``
})
export class LocalizacionComponent {}
