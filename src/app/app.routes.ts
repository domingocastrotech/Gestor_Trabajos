import { Routes } from '@angular/router';
import { BasicTablesComponent } from './pages/tables/basic-tables/basic-tables.component';
import { BlankComponent } from './pages/blank/blank.component';
import { NotFoundComponent } from './pages/other-page/not-found/not-found.component';
import { UnauthorizedComponent } from './pages/other-page/unauthorized/unauthorized.component';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
import { AlertsComponent } from './pages/ui-elements/alerts/alerts.component';
import { SignInComponent } from './pages/auth-pages/sign-in/sign-in.component';
import { AuthCallbackComponent } from './pages/auth-pages/auth-callback/auth-callback.component';
import { CalenderComponent } from './pages/calender/calender.component';
import { LocalizacionComponent } from './pages/tables/localizacion/localizacion.component';
import { NotificationsComponent } from './pages/notifications/notifications.component';
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
        path:'notifications',
        component:NotificationsComponent,
        title:'Notificaciones | Gestor Trabajo'
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
  {
    path: 'auth/callback',
    component: AuthCallbackComponent,
    title: 'Procesando autenticación | Gestor Trabajo'
  },
  // Unauthorized access page
  {
    path: 'unauthorized',
    component: UnauthorizedComponent,
    title: 'Acceso No Autorizado | Gestor Trabajo'
  },
  // error pages
  {
    path:'**',
    component:NotFoundComponent,
    title:'Not Found | Gestor Trabajo'
  },
];
