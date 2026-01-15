import { Routes } from '@angular/router';
import { BasicTablesComponent } from './pages/tables/basic-tables/basic-tables.component';
import { BlankComponent } from './pages/blank/blank.component';
import { NotFoundComponent } from './pages/other-page/not-found/not-found.component';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
import { AlertsComponent } from './pages/ui-elements/alerts/alerts.component';
import { SignInComponent } from './pages/auth-pages/sign-in/sign-in.component';
import { CalenderComponent } from './pages/calender/calender.component';
import { LocalizacionComponent } from './pages/tables/localizacion/localizacion.component';
import { authGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
  {
    path:'',
    component:AppLayoutComponent,
    canActivate:[authGuard],
    children:[
      {
        path: '',
        component: BlankComponent,
        pathMatch: 'full',
        title: 'Dashboard | Gestor Trabajo'
      },
      {
        path:'calendar',
        component:CalenderComponent,
        title:'Calendar | Gestor Trabajo'
      },
      {
        path:'empleados',
        component:BasicTablesComponent,
        title:'Empleados | Gestión'
      },
      {
        path:'localizacion',
        component:LocalizacionComponent,
        title:'Localización | Gestión'
      },
      {
        path:'blank',
        component:BlankComponent,
        title:'Blank Page | Gestor Trabajo'
      },
      {
        path:'alerts',
        component:AlertsComponent,
        title:'Alerts | Gestor Trabajo'
      },
    ]
  },
  // auth pages
  {
    path:'signin',
    component:SignInComponent,
    title:'Sign In | Gestor Trabajo'
  },
  // error pages
  {
    path:'**',
    component:NotFoundComponent,
    title:'Not Found | Gestor Trabajo'
  },
];
