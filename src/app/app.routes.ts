import { Routes } from '@angular/router';                                              // Tipo para definir rutas
import { authGuard } from './guardias/auth.guard';                                     // Guardia de seguridad
import { LoginComponent } from './paginas/login/login.component';                      // Página de login
import { InicioComponent } from './paginas/inicio/inicio.component';                   // Página principal
import { CitasComponent } from './modulos/citas/citas.component';                      // Módulo 1
import { HistoriaClinicaComponent } from './modulos/historia-clinica/historia-clinica.component'; // Módulo 2
import { TratamientosComponent } from './modulos/tratamientos/tratamientos.component'; // Módulo 3
import { FacturacionComponent } from './modulos/facturacion/facturacion.component';    // Módulo 4
import { InventarioComponent } from './modulos/inventario/inventario.component';       // Módulo 5

export const routes: Routes = [                                                        // Lista de rutas de la app
  { path: '', redirectTo: 'login', pathMatch: 'full' },                                // Si la URL está vacía, va al login
  { path: 'login', component: LoginComponent },                                        // /login muestra el login
  { path: 'inicio', component: InicioComponent, canActivate: [authGuard] },            // /inicio solo con sesión iniciada
  { path: 'citas', component: CitasComponent, canActivate: [authGuard] },              // /citas protegido
  { path: 'historia-clinica', component: HistoriaClinicaComponent, canActivate: [authGuard] }, // protegido
  { path: 'tratamientos', component: TratamientosComponent, canActivate: [authGuard] },        // protegido
  { path: 'facturacion', component: FacturacionComponent, canActivate: [authGuard] },          // protegido
  { path: 'inventario', component: InventarioComponent, canActivate: [authGuard] },            // protegido
  { path: '**', redirectTo: 'login' }                                                  // Cualquier otra URL va al login
];